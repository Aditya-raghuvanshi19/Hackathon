import DataFile from '../models/dataFile.model.js';
import ProcessedData from '../models/processedData.model.js';
import ProcessingJob from '../models/processingJob.model.js';
import { dataProcessingService } from '../services/dataProcessing.service.js';
import { validationService } from '../services/validation.service.js';
import { fileProcessingService } from '../services/fileProcessing.service.js';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size } = req.file;
    const fileType = fileProcessingService.getFileType(mimetype, originalname);

    const dataFile = new DataFile({
      filename,
      originalName: originalname,
      fileType,
      fileSize: size,
      uploadedBy: req.user.id,
      processingStatus: 'pending'
    });

    await dataFile.save();

    // Queue processing job
    const job = new ProcessingJob({
      jobId: `extract_${dataFile._id}_${Date.now()}`,
      jobType: 'extract',
      userId: req.user.id,
      inputFiles: [dataFile._id],
      configuration: req.body.config || {}
    });

    await job.save();

    // Start processing asynchronously
    dataProcessingService.processFile(dataFile._id, job._id).catch(console.error);

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: dataFile._id,
      jobId: job.jobId,
      file: dataFile
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

export const getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, fileType } = req.query;
    const query = { uploadedBy: req.user.id, isActive: true };

    if (status) query.processingStatus = status;
    if (fileType) query.fileType = fileType;

    const files = await DataFile.find(query)
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name email');

    const total = await DataFile.countDocuments(query);

    res.json({
      files,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

export const getFileDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await DataFile.findOne({
      _id: id,
      uploadedBy: req.user.id
    }).populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const processedData = await ProcessedData.find({ dataFileId: id })
      .sort({ createdAt: -1 })
      .limit(1);

    const jobs = await ProcessingJob.find({ inputFiles: id })
      .sort({ createdAt: -1 });

    res.json({
      file,
      processedData: processedData[0] || null,
      jobs
    });
  } catch (error) {
    console.error('Get file details error:', error);
    res.status(500).json({ error: 'Failed to fetch file details' });
  }
};

export const processFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { transformations, validationRules } = req.body;

    const file = await DataFile.findOne({
      _id: id,
      uploadedBy: req.user.id
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const job = new ProcessingJob({
      jobId: `transform_${id}_${Date.now()}`,
      jobType: 'transform',
      userId: req.user.id,
      inputFiles: [id],
      configuration: { transformations, validationRules }
    });

    await job.save();

    // Start processing
    dataProcessingService.processFile(id, job._id, {
      transformations,
      validationRules
    }).catch(console.error);

    res.json({
      message: 'Processing started',
      jobId: job.jobId
    });
  } catch (error) {
    console.error('Process file error:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
};

export const validateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { rules } = req.body;

    const processedData = await ProcessedData.findOne({
      dataFileId: id,
      processedBy: req.user.id
    });

    if (!processedData) {
      return res.status(404).json({ error: 'Processed data not found' });
    }

    const validationResults = await validationService.validateData(
      processedData.data,
      rules
    );

    processedData.validationResults = validationResults;
    processedData.validationStatus = validationResults.every(r => r.status === 'valid') 
      ? 'valid' 
      : validationResults.some(r => r.status === 'invalid') ? 'invalid' : 'warning';

    await processedData.save();

    res.json({
      validationResults,
      status: processedData.validationStatus
    });
  } catch (error) {
    console.error('Validate data error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
};

export const exportData = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv', filters = {} } = req.query;

    const processedData = await ProcessedData.findOne({
      dataFileId: id,
      processedBy: req.user.id
    });

    if (!processedData) {
      return res.status(404).json({ error: 'Processed data not found' });
    }

    const exportData = await dataProcessingService.exportData(
      processedData.data,
      format,
      filters
    );

    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
};

export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await ProcessingJob.findOne({
      jobId,
      userId: req.user.id
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalFiles = await DataFile.countDocuments({ uploadedBy: userId, isActive: true });
    const processedFiles = await DataFile.countDocuments({ 
      uploadedBy: userId, 
      processingStatus: 'completed',
      isActive: true 
    });
    const failedFiles = await DataFile.countDocuments({ 
      uploadedBy: userId, 
      processingStatus: 'failed',
      isActive: true 
    });

    const totalDataSize = await DataFile.aggregate([
      { $match: { uploadedBy: userId, isActive: true } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);

    const avgProcessingTime = await ProcessingJob.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { _id: null, avgTime: { $avg: '$actualDuration' } } }
    ]);

    const recentJobs = await ProcessingJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('inputFiles', 'originalName fileType');

    const fileTypeDistribution = await DataFile.aggregate([
      { $match: { uploadedBy: userId, isActive: true } },
      { $group: { _id: '$fileType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalFiles,
      processedFiles,
      failedFiles,
      totalDataSize: totalDataSize[0]?.totalSize || 0,
      avgProcessingTime: avgProcessingTime[0]?.avgTime || 0,
      recentJobs,
      fileTypeDistribution
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};