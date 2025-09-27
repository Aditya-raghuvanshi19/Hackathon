import Joi from 'joi';

class ValidationService {
  constructor() {
    this.validationRules = {
      required: this.validateRequired,
      type: this.validateType,
      range: this.validateRange,
      pattern: this.validatePattern,
      enum: this.validateEnum,
      unique: this.validateUnique,
      custom: this.validateCustom,
      email: this.validateEmail,
      date: this.validateDate,
      length: this.validateLength
    };
  }

  async validateData(data, rules) {
    if (!Array.isArray(data) || !Array.isArray(rules)) {
      throw new Error('Data must be array and rules must be array');
    }

    const results = [];

    for (const rule of rules) {
      try {
        const ruleResults = await this.applyRule(data, rule);
        results.push(...ruleResults);
      } catch (error) {
        results.push({
          rule: rule.name || 'unknown',
          field: rule.field || 'unknown',
          status: 'error',
          message: `Validation error: ${error.message}`
        });
      }
    }

    return results;
  }

  async applyRule(data, rule) {
    const { type, field, ...params } = rule;
    
    if (!this.validationRules[type]) {
      return [{
        rule: rule.name || type,
        field,
        status: 'error',
        message: `Unknown validation rule: ${type}`
      }];
    }

    return this.validationRules[type].call(this, data, field, params);
  }

  validateRequired(data, field, params) {
    const results = [];
    
    data.forEach((row, index) => {
      const value = row[field];
      const isEmpty = value === null || value === undefined || value === '';
      
      results.push({
        rule: 'required',
        field,
        rowIndex: index,
        status: isEmpty ? 'invalid' : 'valid',
        message: isEmpty ? `Field ${field} is required` : 'Valid'
      });
    });

    return results;
  }

  validateType(data, field, params) {
    const { expectedType } = params;
    const results = [];

    data.forEach((row, index) => {
      const value = row[field];
      const isValid = this.checkType(value, expectedType);
      
      results.push({
        rule: 'type',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Expected ${expectedType}, got ${typeof value}`
      });
    });

    return results;
  }

  validateRange(data, field, params) {
    const { min, max } = params;
    const results = [];

    data.forEach((row, index) => {
      const value = Number(row[field]);
      const isValid = !isNaN(value) && 
                      (min === undefined || value >= min) && 
                      (max === undefined || value <= max);
      
      results.push({
        rule: 'range',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Value must be between ${min || 'any'} and ${max || 'any'}`
      });
    });

    return results;
  }

  validatePattern(data, field, params) {
    const { pattern, flags = 'i' } = params;
    const regex = new RegExp(pattern, flags);
    const results = [];

    data.forEach((row, index) => {
      const value = String(row[field] || '');
      const isValid = regex.test(value);
      
      results.push({
        rule: 'pattern',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Value does not match pattern: ${pattern}`
      });
    });

    return results;
  }

  validateEnum(data, field, params) {
    const { values } = params;
    const results = [];

    data.forEach((row, index) => {
      const value = row[field];
      const isValid = values.includes(value);
      
      results.push({
        rule: 'enum',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Value must be one of: ${values.join(', ')}`
      });
    });

    return results;
  }

  validateUnique(data, field, params) {
    const { scope = 'global' } = params;
    const results = [];
    const seen = new Set();
    const duplicates = new Set();

    // First pass: identify duplicates
    data.forEach(row => {
      const value = row[field];
      if (seen.has(value)) {
        duplicates.add(value);
      } else {
        seen.add(value);
      }
    });

    // Second pass: validate
    data.forEach((row, index) => {
      const value = row[field];
      const isValid = !duplicates.has(value);
      
      results.push({
        rule: 'unique',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Duplicate value: ${value}`
      });
    });

    return results;
  }

  validateCustom(data, field, params) {
    const { validator, message } = params;
    const results = [];

    try {
      const validatorFn = new Function('value', 'row', 'data', validator);
      
      data.forEach((row, index) => {
        try {
          const isValid = validatorFn(row[field], row, data);
          
          results.push({
            rule: 'custom',
            field,
            rowIndex: index,
            status: isValid ? 'valid' : 'invalid',
            message: isValid ? 'Valid' : (message || 'Custom validation failed')
          });
        } catch (error) {
          results.push({
            rule: 'custom',
            field,
            rowIndex: index,
            status: 'error',
            message: `Custom validation error: ${error.message}`
          });
        }
      });
    } catch (error) {
      results.push({
        rule: 'custom',
        field,
        status: 'error',
        message: `Invalid custom validator: ${error.message}`
      });
    }

    return results;
  }

  validateEmail(data, field, params) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const results = [];

    data.forEach((row, index) => {
      const value = String(row[field] || '');
      const isValid = emailPattern.test(value);
      
      results.push({
        rule: 'email',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : 'Invalid email format'
      });
    });

    return results;
  }

  validateDate(data, field, params) {
    const { format, minDate, maxDate } = params;
    const results = [];

    data.forEach((row, index) => {
      const value = row[field];
      let isValid = true;
      let message = 'Valid';

      try {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          isValid = false;
          message = 'Invalid date format';
        } else {
          if (minDate && date < new Date(minDate)) {
            isValid = false;
            message = `Date must be after ${minDate}`;
          } else if (maxDate && date > new Date(maxDate)) {
            isValid = false;
            message = `Date must be before ${maxDate}`;
          }
        }
      } catch (error) {
        isValid = false;
        message = 'Date parsing error';
      }
      
      results.push({
        rule: 'date',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message
      });
    });

    return results;
  }

  validateLength(data, field, params) {
    const { min, max } = params;
    const results = [];

    data.forEach((row, index) => {
      const value = String(row[field] || '');
      const length = value.length;
      const isValid = (min === undefined || length >= min) && 
                      (max === undefined || length <= max);
      
      results.push({
        rule: 'length',
        field,
        rowIndex: index,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : `Length must be between ${min || 0} and ${max || 'unlimited'} characters`
      });
    });

    return results;
  }

  checkType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(Number(value));
      case 'float':
        return typeof value === 'number' && !isNaN(value) && !Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
      case 'date':
        return !isNaN(Date.parse(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  // Predefined validation rule sets
  getCommonRules() {
    return {
      customerData: [
        { type: 'required', field: 'id' },
        { type: 'unique', field: 'id' },
        { type: 'required', field: 'name' },
        { type: 'length', field: 'name', min: 2, max: 100 },
        { type: 'email', field: 'email' },
        { type: 'pattern', field: 'phone', pattern: '^\\+?[1-9]\\d{1,14}$' }
      ],
      transactionData: [
        { type: 'required', field: 'transaction_id' },
        { type: 'unique', field: 'transaction_id' },
        { type: 'type', field: 'amount', expectedType: 'number' },
        { type: 'range', field: 'amount', min: 0 },
        { type: 'date', field: 'date' }
      ],
      productData: [
        { type: 'required', field: 'sku' },
        { type: 'unique', field: 'sku' },
        { type: 'required', field: 'name' },
        { type: 'type', field: 'price', expectedType: 'number' },
        { type: 'range', field: 'price', min: 0 }
      ]
    };
  }

  // Schema validation using Joi
  async validateSchema(data, schema) {
    try {
      const joiSchema = this.buildJoiSchema(schema);
      const results = [];

      for (let i = 0; i < data.length; i++) {
        try {
          await joiSchema.validateAsync(data[i]);
          results.push({
            rule: 'schema',
            rowIndex: i,
            status: 'valid',
            message: 'Valid'
          });
        } catch (error) {
          results.push({
            rule: 'schema',
            rowIndex: i,
            status: 'invalid',
            message: error.details[0].message,
            field: error.details[0].path.join('.')
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Schema validation error: ${error.message}`);
    }
  }

  buildJoiSchema(schema) {
    const joiObject = {};

    for (const [field, rules] of Object.entries(schema)) {
      let joiField = Joi.any();

      if (rules.type) {
        switch (rules.type) {
          case 'string':
            joiField = Joi.string();
            break;
          case 'number':
            joiField = Joi.number();
            break;
          case 'boolean':
            joiField = Joi.boolean();
            break;
          case 'date':
            joiField = Joi.date();
            break;
          case 'email':
            joiField = Joi.string().email();
            break;
        }
      }

      if (rules.required) {
        joiField = joiField.required();
      }

      if (rules.min !== undefined) {
        joiField = joiField.min(rules.min);
      }

      if (rules.max !== undefined) {
        joiField = joiField.max(rules.max);
      }

      if (rules.pattern) {
        joiField = joiField.pattern(new RegExp(rules.pattern));
      }

      if (rules.enum) {
        joiField = joiField.valid(...rules.enum);
      }

      joiObject[field] = joiField;
    }

    return Joi.object(joiObject);
  }
}

export const validationService = new ValidationService();