import mongoose from 'mongoose';
import DataFile from '../models/dataFile.model.js';
import ProcessedData from '../models/processedData.model.js';
import ProcessingJob from '../models/processingJob.model.js';
import CustomerData from '../models/customerData.model.js';
import { fileProcessingService } from '../services/fileProcessing.service.js';
import { customerDataService } from '../services/customerDataService.js';
import { dataProcessingService } from '../services/dataProcessing.service.js';

// Upload multiple files, register them, and kick off merge processing into standardized customer dataset
export const uploadFiles = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const files = req.files || [];

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    // 1) Persist file metadata in DataFile collection
    const savedFiles = [];
    for (const f of files) {
      const fileType = fileProcessingService.getFileType(f.mimetype, f.originalname);
      const df = new DataFile({
        filename: f.filename,
        originalName: f.originalname,
        fileType,
        fileSize: f.size,
        uploadedBy: userId,
        processingStatus: 'pending'
      });
      await df.save();
      savedFiles.push(df);
    }

    const fileIds = savedFiles.map(s => s._id);

    // 2) Create a merge job record
    const job = new ProcessingJob({
      jobId: `merge_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      jobType: 'merge',
      status: 'queued',
      userId,
      inputFiles: fileIds,
      configuration: req.body?.config || {}
    });
    await job.save();

    // 3) Process and merge asynchronously; do not block response
    //    We use customerDataService which handles extraction + normalization + merge
    (async () => {
      try {
        await ProcessingJob.findByIdAndUpdate(job._id, { status: 'running', startedAt: new Date() });

        // Extract each file first using the dataProcessing pipeline so DataFile.extractedData is populated
        const extractJobs = [];
        for (const df of savedFiles) {
          const ej = new ProcessingJob({
            jobId: `extract_${df._id}_${Date.now()}`,
            jobType: 'extract',
            status: 'queued',
            userId,
            inputFiles: [df._id],
            configuration: {}
          });
          await ej.save();
          extractJobs.push(ej);
        }

        // Run extractions sequentially or in parallel; here in parallel
        await Promise.all(extractJobs.map(j => dataProcessingService.processFile(j.inputFiles[0], j._id)));

        // Now merge into unified CustomerData
        const result = await customerDataService.processMultipleFiles(fileIds, userId);

        // Link produced outputs if we generated ProcessedData docs inside service
        if (Array.isArray(result?.outputProcessedDataIds)) {
          await ProcessingJob.findByIdAndUpdate(job._id, {
            status: 'completed',
            outputFiles: result.outputProcessedDataIds,
            completedAt: new Date(),
          });
        } else {
          await ProcessingJob.findByIdAndUpdate(job._id, { status: 'completed', completedAt: new Date() });
        }

        // Mark input files as completed (extraction already set, ensure finalized)
        await DataFile.updateMany({ _id: { $in: fileIds } }, { processingStatus: 'completed' });
      } catch (e) {
        await ProcessingJob.findByIdAndUpdate(job._id, { status: 'failed', completedAt: new Date(), $push: { errors: { error: e?.message, stack: e?.stack } } });
        await DataFile.updateMany({ _id: { $in: fileIds } }, { processingStatus: 'failed' });
      }
    })();

    res.status(202).json({
      message: 'Files uploaded successfully. Merge processing started.',
      fileIds,
      jobId: job.jobId,
      files: savedFiles.map(f => ({ id: f._id, name: f.originalName, type: f.fileType, size: f.fileSize }))
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard metrics for current user
export const getMetrics = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalFiles, jobs, last7Days, dataQualityAgg] = await Promise.all([
      DataFile.countDocuments({ uploadedBy: userObjectId }),
      ProcessingJob.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(100).lean(),
      // trend: processed jobs in last 7 days
      ProcessingJob.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // aggregate data quality from latest ProcessedData
      ProcessedData.aggregate([
        { $match: { processedBy: userObjectId } },
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
        {
          $group: {
            _id: null,
            avgQuality: { $avg: '$metrics.dataQualityScore' },
            avgCompleteness: { $avg: '$metrics.completenessScore' },
            avgAccuracy: { $avg: '$metrics.accuracyScore' },
            avgProcessingTime: { $avg: '$metrics.processingTime' }
          }
        }
      ])
    ]);

    const successCount = jobs.filter(j => j.status === 'completed').length;
    const failureCount = jobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length;

    const kpis = [
      { key: 'dataQuality', label: 'Data Quality', value: Math.round((dataQualityAgg?.[0]?.avgQuality || 0) * 100) / 100 },
      { key: 'completeness', label: 'Completeness', value: Math.round((dataQualityAgg?.[0]?.avgCompleteness || 0) * 100) / 100 },
      { key: 'accuracy', label: 'Accuracy', value: Math.round((dataQualityAgg?.[0]?.avgAccuracy || 0) * 100) / 100 },
      { key: 'avgProcessingTime', label: 'Avg Processing Time (ms)', value: Math.round(dataQualityAgg?.[0]?.avgProcessingTime || 0) }
    ];

    res.json({
      totalFiles,
      successCount,
      failureCount,
      trend: last7Days.map(d => ({ date: d._id, count: d.count })),
      kpis
    });
  } catch (error) {
    next(error);
  }
};

// Return merged, standardized data to UI
export const getProcessedData = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { page = 1, limit = 25, search = '' } = req.query;
    const q = { 'processingInfo.processedBy': userId };
    if (search) {
      q.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { customerId: new RegExp(search, 'i') }
      ];
    }

    const [docs, total] = await Promise.all([
      CustomerData.find(q)
        .select('-transactions')
        .sort({ 'analytics.totalSpent': -1, createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      CustomerData.countDocuments(q)
    ]);

    const items = docs.map(d => ({
      id: d._id,
      customerId: d.customerId,
      name: d.name || d.customerInfo?.name,
      email: d.email || d.customerInfo?.email,
      phone: d.phone || d.customerInfo?.phone,
      totalSpent: d.analytics?.totalSpent,
      totalTransactions: d.analytics?.totalTransactions,
      averageOrderValue: d.analytics?.averageOrderValue,
      segment: d.analytics?.customerSegment,
      favoriteCategory: d.analytics?.favoriteCategory,
      processedAt: d.processingInfo?.processedAt
    }));

    res.json({
      data: items,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Download merged dataset (csv|xlsx|json)
export const downloadReport = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { type = 'csv' } = req.params;

    const customers = await CustomerData.find({ 'processingInfo.processedBy': new mongoose.Types.ObjectId(userId) })
      .select('-transactions')
      .sort({ 'analytics.totalSpent': -1 })
      .lean();

    // Flatten for export
    const exportRows = customers.map(c => ({
      customerId: c.customerId || c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      segment: c.analytics?.customerSegment,
      favoriteCategory: c.analytics?.favoriteCategory,
      totalSpent: c.analytics?.totalSpent,
      totalTransactions: c.analytics?.totalTransactions,
      averageOrderValue: c.analytics?.averageOrderValue
    }));

    const fileBase = `customer_data_${new Date().toISOString().slice(0, 10)}`;
    if (type === 'json') {
      const out = dataProcessingService.exportToJSON(exportRows);
      res.setHeader('Content-Type', out.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.json"`);
      return res.send(out.content);
    }

    if (type === 'xlsx') {
      const out = dataProcessingService.exportToExcel(exportRows);
      res.setHeader('Content-Type', out.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
      return res.send(out.content);
    }

    // default CSV
    const out = dataProcessingService.exportToCSV(exportRows);
    res.setHeader('Content-Type', out.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
    return res.send(out.content);
  } catch (error) {
    next(error);
  }
};