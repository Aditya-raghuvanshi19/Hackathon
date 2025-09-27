import csv from 'csv-parser';
import XLSX from 'xlsx';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileProcessingService {
  constructor() {
    this.supportedTypes = {
      'text/csv': 'csv',
      'application/vnd.ms-excel': 'xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/json': 'json',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'application/xml': 'xml',
      'text/xml': 'xml'
    };
  }

  getFileType(mimetype, filename) {
    const typeFromMime = this.supportedTypes[mimetype];
    if (typeFromMime) return typeFromMime;

    const extension = path.extname(filename).toLowerCase();
    const extensionMap = {
      '.csv': 'csv',
      '.xlsx': 'xlsx',
      '.xls': 'xlsx',
      '.json': 'json',
      '.pdf': 'pdf',
      '.docx': 'docx',
      '.txt': 'txt',
      '.xml': 'xml'
    };

    return extensionMap[extension] || 'unknown';
  }

  async extractData(filePath, fileType, options = {}) {
    try {
      switch (fileType) {
        case 'csv':
          return await this.extractFromCSV(filePath, options);
        case 'xlsx':
          return await this.extractFromExcel(filePath, options);
        case 'json':
          return await this.extractFromJSON(filePath, options);
        case 'pdf':
          return await this.extractFromPDF(filePath, options);
        case 'docx':
          return await this.extractFromDocx(filePath, options);
        case 'xml':
          return await this.extractFromXML(filePath, options);
        case 'txt':
          return await this.extractFromText(filePath, options);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Data extraction error:', error);
      throw error;
    }
  }

  async extractFromCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const headers = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(csv({
          separator: options.delimiter || ',',
          headers: options.headers !== false
        }))
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (isFirstRow && !options.headers) {
            headers.push(...Object.keys(data));
            isFirstRow = false;
          }
          results.push(data);
        })
        .on('end', () => {
          resolve({
            data: results,
            metadata: {
              totalRows: results.length,
              columns: headers,
              fileType: 'csv'
            }
          });
        })
        .on('error', reject);
    });
  }

  async extractFromExcel(filePath, options = {}) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = options.sheet || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.headers === false ? 1 : undefined,
        defval: '',
        raw: false
      });

      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const headers = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? cell.v : `Column_${col + 1}`);
      }

      return {
        data: jsonData,
        metadata: {
          totalRows: jsonData.length,
          columns: headers,
          fileType: 'xlsx',
          sheets: workbook.SheetNames,
          activeSheet: sheetName
        }
      };
    } catch (error) {
      throw new Error(`Excel processing error: ${error.message}`);
    }
  }

  async extractFromJSON(filePath, options = {}) {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      let data, columns;
      
      if (Array.isArray(jsonData)) {
        data = jsonData;
        columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      } else if (typeof jsonData === 'object') {
        // Handle nested JSON
        data = this.flattenJSON(jsonData, options.maxDepth || 3);
        columns = Object.keys(data);
      } else {
        data = [{ value: jsonData }];
        columns = ['value'];
      }

      return {
        data,
        metadata: {
          totalRows: Array.isArray(data) ? data.length : 1,
          columns,
          fileType: 'json'
        }
      };
    } catch (error) {
      throw new Error(`JSON processing error: ${error.message}`);
    }
  }

  async extractFromPDF(filePath, options = {}) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      
      const text = pdfData.text;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Try to detect tabular data
      const data = this.parseTextToTable(lines, options);

      return {
        data,
        metadata: {
          totalRows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          fileType: 'pdf',
          pages: pdfData.numpages,
          rawText: text
        }
      };
    } catch (error) {
      throw new Error(`PDF processing error: ${error.message}`);
    }
  }

  async extractFromDocx(filePath, options = {}) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      const lines = text.split('\n').filter(line => line.trim());
      
      const data = this.parseTextToTable(lines, options);

      return {
        data,
        metadata: {
          totalRows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          fileType: 'docx',
          rawText: text
        }
      };
    } catch (error) {
      throw new Error(`DOCX processing error: ${error.message}`);
    }
  }

  async extractFromText(filePath, options = {}) {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      const lines = text.split('\n').filter(line => line.trim());
      
      const data = this.parseTextToTable(lines, options);

      return {
        data,
        metadata: {
          totalRows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          fileType: 'txt',
          rawText: text
        }
      };
    } catch (error) {
      throw new Error(`Text processing error: ${error.message}`);
    }
  }

  async extractFromXML(filePath, options = {}) {
    try {
      const xmlData = fs.readFileSync(filePath, 'utf8');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      
      const parsedXML = parser.parse(xmlData);
      
      // Try to identify the data array in XML
      let data = [];
      let rootKey = Object.keys(parsedXML)[0];
      let xmlContent = parsedXML[rootKey];
      
      // Handle different XML structures
      if (Array.isArray(xmlContent)) {
        data = xmlContent;
      } else if (xmlContent && typeof xmlContent === 'object') {
        // Look for array properties
        const arrayKeys = Object.keys(xmlContent).filter(key => Array.isArray(xmlContent[key]));
        
        if (arrayKeys.length > 0) {
          // Use the first array found
          data = xmlContent[arrayKeys[0]];
        } else {
          // If no arrays, treat each property as a separate record
          data = [xmlContent];
        }
      }
      
      // Flatten XML objects to make them more table-like
      data = data.map(item => this.flattenXMLObject(item));

      return {
        data,
        metadata: {
          totalRows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          fileType: 'xml',
          rootElement: rootKey
        }
      };
    } catch (error) {
      throw new Error(`XML processing error: ${error.message}`);
    }
  }

  parseTextToTable(lines, options = {}) {
    const delimiter = options.delimiter || /\s{2,}|\t|,|;|\|/;
    const data = [];
    
    if (lines.length === 0) return data;

    // Assume first line contains headers
    const headers = lines[0].split(delimiter).map(h => h.trim()).filter(h => h);
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim()).filter(v => v);
      
      if (values.length > 0) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Only add row if it has some content
        if (Object.values(row).some(value => value)) {
          data.push(row);
        }
      }
    }

    return data;
  }

  flattenXMLObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenXMLObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  flattenJSON(obj, maxDepth = 3, currentDepth = 0, prefix = '') {
    const flattened = {};
    
    if (currentDepth >= maxDepth) {
      flattened[prefix || 'value'] = JSON.stringify(obj);
      return flattened;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenJSON(obj[key], maxDepth, currentDepth + 1, newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  detectSchema(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return {};
    }

    const schema = {};
    const sample = data.slice(0, Math.min(100, data.length)); // Analyze first 100 rows

    // Get all possible columns
    const allColumns = new Set();
    sample.forEach(row => {
      Object.keys(row).forEach(key => allColumns.add(key));
    });

    allColumns.forEach(column => {
      const values = sample.map(row => row[column]).filter(v => v !== undefined && v !== null && v !== '');
      
      if (values.length === 0) {
        schema[column] = { type: 'string', nullable: true };
        return;
      }

      // Detect type
      const types = new Set(values.map(v => this.detectValueType(v)));
      
      schema[column] = {
        type: types.size === 1 ? Array.from(types)[0] : 'mixed',
        nullable: values.length < sample.length,
        examples: values.slice(0, 3),
        unique: new Set(values).size === values.length,
        minLength: Math.min(...values.map(v => String(v).length)),
        maxLength: Math.max(...values.map(v => String(v).length))
      };
    });

    return schema;
  }

  detectValueType(value) {
    if (value === null || value === undefined || value === '') return 'null';
    
    const str = String(value).trim();
    
    // Number detection
    if (!isNaN(str) && !isNaN(parseFloat(str))) {
      return str.includes('.') ? 'float' : 'integer';
    }
    
    // Boolean detection
    if (['true', 'false', '1', '0', 'yes', 'no'].includes(str.toLowerCase())) {
      return 'boolean';
    }
    
    // Date detection
    if (this.isDate(str)) {
      return 'date';
    }
    
    // Email detection
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      return 'email';
    }
    
    // URL detection
    if (/^https?:\/\/.+/.test(str)) {
      return 'url';
    }
    
    return 'string';
  }

  isDate(str) {
    const date = new Date(str);
    return !isNaN(date.getTime()) && str.length > 8;
  }
}

export const fileProcessingService = new FileProcessingService();