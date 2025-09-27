import DataFile from '../models/dataFile.model.js';
import ProcessedData from '../models/processedData.model.js';
import ProcessingJob from '../models/processingJob.model.js';
import { fileProcessingService } from './fileProcessing.service.js';
import { validationService } from './validation.service.js';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataProcessingService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.ensureUploadsDir();
  }

  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async processFile(fileId, jobId, options = {}) {
    const job = await ProcessingJob.findById(jobId);
    const dataFile = await DataFile.findById(fileId);

    if (!job || !dataFile) {
      throw new Error('Job or file not found');
    }

    try {
      await this.updateJobStatus(jobId, 'running', 'Starting file processing', 10);

      const filePath = path.join(this.uploadsDir, dataFile.filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found on disk');
      }

      // Extract data
      await this.updateJobStatus(jobId, 'running', 'Extracting data from file', 30);
      const extractedResult = await fileProcessingService.extractData(
        filePath, 
        dataFile.fileType, 
        options.extractionOptions
      );

      // Detect schema
      await this.updateJobStatus(jobId, 'running', 'Analyzing data schema', 50);
      const schema = fileProcessingService.detectSchema(extractedResult.data);

      // Update file with extracted data
      dataFile.extractedData = extractedResult.data;
      dataFile.metadata = {
        ...extractedResult.metadata,
        schema,
        totalRows: extractedResult.data.length,
        validRows: extractedResult.data.length,
        invalidRows: 0
      };
      dataFile.processingStatus = 'completed';
      await dataFile.save();

      // Apply transformations if provided
      let processedData = extractedResult.data;
      const transformations = [];

      if (options.transformations && options.transformations.length > 0) {
        await this.updateJobStatus(jobId, 'running', 'Applying transformations', 70);
        const transformResult = await this.applyTransformations(
          processedData, 
          options.transformations
        );
        processedData = transformResult.data;
        transformations.push(...transformResult.transformations);
      }

      // Validate data if rules provided
      let validationResults = [];
      let validationStatus = 'valid';

      if (options.validationRules && options.validationRules.length > 0) {
        await this.updateJobStatus(jobId, 'running', 'Validating data', 85);
        validationResults = await validationService.validateData(
          processedData, 
          options.validationRules
        );
        validationStatus = this.determineValidationStatus(validationResults);
      }

      // Create processed data record
      const processedDataRecord = new ProcessedData({
        dataFileId: fileId,
        processedBy: job.userId,
        data: processedData,
        transformations,
        validationStatus,
        validationResults,
        metrics: this.calculateMetrics(extractedResult.data, processedData, validationResults)
      });

      await processedDataRecord.save();

      // Update job
      job.status = 'completed';
      job.completedAt = new Date();
      job.actualDuration = Date.now() - job.startedAt?.getTime() || 0;
      job.outputFiles = [processedDataRecord._id];
      job.progress.percentage = 100;
      job.progress.currentStep = 'Completed';
      job.logs.push({
        level: 'info',
        message: 'File processing completed successfully',
        details: {
          totalRows: processedData.length,
          validationStatus,
          transformationsApplied: transformations.length
        }
      });

      await job.save();

      return {
        success: true,
        dataFile,
        processedData: processedDataRecord
      };

    } catch (error) {
      console.error('Processing error:', error);
      
      // Update job with error
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push({
        error: error.message,
        stack: error.stack
      });
      job.logs.push({
        level: 'error',
        message: 'File processing failed',
        details: { error: error.message }
      });

      await job.save();

      // Update file status
      dataFile.processingStatus = 'failed';
      await dataFile.save();

      throw error;
    }
  }

  async applyTransformations(data, transformations) {
    let processedData = [...data];
    const appliedTransformations = [];

    for (const transformation of transformations) {
      const startTime = Date.now();
      
      switch (transformation.type) {
        case 'rename_column':
          processedData = this.renameColumn(processedData, transformation.oldName, transformation.newName);
          break;
        case 'remove_column':
          processedData = this.removeColumn(processedData, transformation.column);
          break;
        case 'convert_type':
          processedData = this.convertType(processedData, transformation.column, transformation.targetType);
          break;
        case 'filter_rows':
          processedData = this.filterRows(processedData, transformation.condition);
          break;
        case 'sort':
          processedData = this.sortData(processedData, transformation.column, transformation.order);
          break;
        case 'deduplicate':
          processedData = this.deduplicateData(processedData, transformation.columns);
          break;
        case 'aggregate':
          processedData = this.aggregateData(processedData, transformation.groupBy, transformation.operations);
          break;
        case 'normalize':
          processedData = this.normalizeColumn(processedData, transformation.column, transformation.method);
          break;
        default:
          console.warn(`Unknown transformation type: ${transformation.type}`);
      }

      appliedTransformations.push({
        operation: transformation.type,
        field: transformation.column,
        duration: Date.now() - startTime,
        timestamp: new Date()
      });
    }

    return {
      data: processedData,
      transformations: appliedTransformations
    };
  }

  renameColumn(data, oldName, newName) {
    return data.map(row => {
      const newRow = { ...row };
      if (oldName in newRow) {
        newRow[newName] = newRow[oldName];
        delete newRow[oldName];
      }
      return newRow;
    });
  }

  removeColumn(data, column) {
    return data.map(row => {
      const newRow = { ...row };
      delete newRow[column];
      return newRow;
    });
  }

  convertType(data, column, targetType) {
    return data.map(row => {
      const newRow = { ...row };
      if (column in newRow) {
        newRow[column] = this.convertValue(newRow[column], targetType);
      }
      return newRow;
    });
  }

  convertValue(value, targetType) {
    try {
      switch (targetType) {
        case 'string':
          return String(value);
        case 'number':
          return Number(value);
        case 'boolean':
          return Boolean(value);
        case 'date':
          return new Date(value);
        default:
          return value;
      }
    } catch {
      return value; // Return original value if conversion fails
    }
  }

  filterRows(data, condition) {
    try {
      return data.filter(row => {
        // Simple condition evaluation
        // In production, you'd want a more secure expression evaluator
        const conditionStr = condition
          .replace(/\{([^}]+)\}/g, (match, field) => `row['${field}']`);
        return eval(conditionStr);
      });
    } catch {
      console.warn('Invalid filter condition, returning original data');
      return data;
    }
  }

  sortData(data, column, order = 'asc') {
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (order === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
  }

  deduplicateData(data, columns) {
    const seen = new Set();
    return data.filter(row => {
      const key = columns ? columns.map(col => row[col]).join('|') : JSON.stringify(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  aggregateData(data, groupBy, operations) {
    const groups = {};
    
    data.forEach(row => {
      const key = groupBy.map(col => row[col]).join('|');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });

    return Object.entries(groups).map(([key, group]) => {
      const result = {};
      
      // Add group by columns
      groupBy.forEach((col, index) => {
        result[col] = key.split('|')[index];
      });

      // Apply operations
      operations.forEach(op => {
        const values = group.map(row => Number(row[op.column])).filter(v => !isNaN(v));
        
        switch (op.operation) {
          case 'sum':
            result[`${op.column}_sum`] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[`${op.column}_avg`] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'min':
            result[`${op.column}_min`] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            result[`${op.column}_max`] = values.length > 0 ? Math.max(...values) : null;
            break;
          case 'count':
            result[`${op.column}_count`] = group.length;
            break;
        }
      });

      return result;
    });
  }

  normalizeColumn(data, column, method) {
    const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));
    
    if (values.length === 0) return data;

    let min, max, mean, std;
    
    switch (method) {
      case 'min_max':
        min = Math.min(...values);
        max = Math.max(...values);
        break;
      case 'z_score':
        mean = values.reduce((a, b) => a + b) / values.length;
        std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
        break;
    }

    return data.map(row => {
      const newRow = { ...row };
      const value = Number(newRow[column]);
      
      if (!isNaN(value)) {
        switch (method) {
          case 'min_max':
            newRow[column] = max > min ? (value - min) / (max - min) : 0;
            break;
          case 'z_score':
            newRow[column] = std > 0 ? (value - mean) / std : 0;
            break;
        }
      }
      
      return newRow;
    });
  }

  determineValidationStatus(validationResults) {
    if (validationResults.some(r => r.status === 'invalid')) {
      return 'invalid';
    } else if (validationResults.some(r => r.status === 'warning')) {
      return 'warning';
    } else {
      return 'valid';
    }
  }

  calculateMetrics(originalData, processedData, validationResults) {
    const processingTime = Date.now();
    const dataQualityScore = this.calculateDataQualityScore(processedData, validationResults);
    const completenessScore = this.calculateCompletenessScore(processedData);
    const accuracyScore = this.calculateAccuracyScore(validationResults);

    return {
      processingTime,
      dataQualityScore,
      completenessScore,
      accuracyScore
    };
  }

  calculateDataQualityScore(data, validationResults) {
    if (!validationResults || validationResults.length === 0) return 100;
    
    const validCount = validationResults.filter(r => r.status === 'valid').length;
    return Math.round((validCount / validationResults.length) * 100);
  }

  calculateCompletenessScore(data) {
    if (!data || data.length === 0) return 0;
    
    const allFields = new Set();
    data.forEach(row => Object.keys(row).forEach(key => allFields.add(key)));
    
    const totalFields = allFields.size * data.length;
    const filledFields = data.reduce((count, row) => {
      return count + Object.values(row).filter(v => v !== null && v !== undefined && v !== '').length;
    }, 0);

    return Math.round((filledFields / totalFields) * 100);
  }

  calculateAccuracyScore(validationResults) {
    if (!validationResults || validationResults.length === 0) return 100;
    
    const validCount = validationResults.filter(r => r.status === 'valid').length;
    return Math.round((validCount / validationResults.length) * 100);
  }

  async updateJobStatus(jobId, status, currentStep, percentage) {
    await ProcessingJob.findByIdAndUpdate(jobId, {
      status,
      'progress.currentStep': currentStep,
      'progress.percentage': percentage,
      ...(status === 'running' && !await ProcessingJob.findOne({ _id: jobId, startedAt: { $exists: true } }) ? { startedAt: new Date() } : {})
    });
  }

  async exportData(data, format, filters = {}) {
    // Apply filters
    let filteredData = data;
    
    if (filters.columns && filters.columns.length > 0) {
      filteredData = data.map(row => {
        const newRow = {};
        filters.columns.forEach(col => {
          if (row[col] !== undefined) newRow[col] = row[col];
        });
        return newRow;
      });
    }

    if (filters.limit) {
      filteredData = filteredData.slice(0, filters.limit);
    }

    // Export in requested format
    switch (format) {
      case 'csv':
        return this.exportToCSV(filteredData);
      case 'json':
        return this.exportToJSON(filteredData);
      case 'xlsx':
        return this.exportToExcel(filteredData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV(data) {
    if (data.length === 0) {
      return {
        content: '',
        filename: `export_${Date.now()}.csv`,
        contentType: 'text/csv'
      };
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return {
      content: csvContent,
      filename: `export_${Date.now()}.csv`,
      contentType: 'text/csv'
    };
  }

  exportToJSON(data) {
    return {
      content: JSON.stringify(data, null, 2),
      filename: `export_${Date.now()}.json`,
      contentType: 'application/json'
    };
  }

  exportToExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return {
      content: buffer,
      filename: `export_${Date.now()}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
}

export const dataProcessingService = new DataProcessingService();