/**
 * AI Response Validator
 * Validate and verify AI responses against expected formats and constraints
 */

export interface Schema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  enum?: any[];
  items?: Schema;
  [key: string]: any;
}

export interface ValidationRule {
  name: string;
  validate: (response: string) => ValidationResult;
}

export interface ValidationRules {
  format?: 'json' | 'yaml' | 'markdown' | 'text';
  schema?: Schema;
  maxLength?: number;
  minLength?: number;
  maxWords?: number;
  minWords?: number;
  required?: string[];
  prohibited?: string[];
  customRules?: ValidationRule[];
}

export interface ValidatorOptions {
  customRules?: ValidationRule[];
  defaultMaxLength?: number;
  defaultMinLength?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  message?: string;
}

export class Validator {
  private customRules: ValidationRule[];
  private defaultMaxLength: number;
  private defaultMinLength: number;

  constructor(options: ValidatorOptions = {}) {
    this.customRules = options.customRules || [];
    this.defaultMaxLength = options.defaultMaxLength || 10000;
    this.defaultMinLength = options.defaultMinLength || 0;
  }

  /**
   * Validate a response against the given rules
   */
  validate(response: string, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Format validation
    if (rules.format) {
      const formatResult = this.validateFormat(response, rules.format);
      if (!formatResult.isValid && formatResult.errors) {
        errors.push(...formatResult.errors);
      }
    }

    // Length validation
    if (rules.maxLength || rules.minLength) {
      const lengthResult = this.validateLength(response, rules.maxLength, rules.minLength);
      if (!lengthResult.isValid && lengthResult.errors) {
        errors.push(...lengthResult.errors);
      }
    }

    // Word count validation
    if (rules.maxWords || rules.minWords) {
      const wordResult = this.validateWordCount(response, rules.maxWords, rules.minWords);
      if (!wordResult.isValid && wordResult.errors) {
        errors.push(...wordResult.errors);
      }
    }

    // Schema validation
    if (rules.schema) {
      const schemaResult = this.validateSchema(response, rules.schema);
      if (!schemaResult.isValid && schemaResult.errors) {
        errors.push(...schemaResult.errors);
      }
    }

    // Required content validation
    if (rules.required && rules.required.length > 0) {
      const requiredResult = this.validateRequiredContent(response, rules.required);
      if (!requiredResult.isValid && requiredResult.errors) {
        errors.push(...requiredResult.errors);
      }
    }

    // Prohibited content validation
    if (rules.prohibited && rules.prohibited.length > 0) {
      const prohibitedResult = this.validateProhibitedContent(response, rules.prohibited);
      if (!prohibitedResult.isValid && prohibitedResult.errors) {
        errors.push(...prohibitedResult.errors);
      }
    }

    // Custom rules validation
    const allRules = [...this.customRules, ...(rules.customRules || [])];
    for (const rule of allRules) {
      const customResult = rule.validate(response);
      if (!customResult.isValid && customResult.message) {
        errors.push(customResult.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate response against a JSON schema
   */
  validateSchema(response: string, schema: Schema): ValidationResult {
    const errors: string[] = [];

    try {
      let data: any;
      
      // Try to parse as JSON first
      try {
        data = JSON.parse(response);
      } catch {
        // If not JSON, treat as string
        data = response;
      }

      // Basic schema validation
      if (schema.type) {
        const actualType = typeof data;
        if (schema.type === 'object' && actualType !== 'object') {
          errors.push(`Expected object, got ${actualType}`);
        } else if (schema.type === 'string' && actualType !== 'string') {
          errors.push(`Expected string, got ${actualType}`);
        } else if (schema.type === 'number' && actualType !== 'number') {
          errors.push(`Expected number, got ${actualType}`);
        } else if (schema.type === 'array' && !Array.isArray(data)) {
          errors.push(`Expected array, got ${actualType}`);
        }
      }

      // String validation
      if (schema.type === 'string' && typeof data === 'string') {
        if (schema.minLength !== undefined && data.length < schema.minLength) {
          errors.push(`String length ${data.length} is less than minimum ${schema.minLength}`);
        }
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
          errors.push(`String length ${data.length} exceeds maximum ${schema.maxLength}`);
        }
        if (schema.format === 'email' && !this.isValidEmail(data)) {
          errors.push('Invalid email format');
        }
        if (schema.enum && !schema.enum.includes(data)) {
          errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
        }
      }

      // Number validation
      if (schema.type === 'number' && typeof data === 'number') {
        if (schema.minimum !== undefined && data < schema.minimum) {
          errors.push(`Value ${data} is less than minimum ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && data > schema.maximum) {
          errors.push(`Value ${data} exceeds maximum ${schema.maximum}`);
        }
      }

      // Object validation
      if (schema.type === 'object' && typeof data === 'object' && data !== null) {
        if (schema.required) {
          for (const field of schema.required) {
            if (!(field in data)) {
              errors.push(`Missing required field: ${field}`);
            }
          }
        }
        
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in data) {
              const value = data[key];
              const propResult = this.validateSchema(JSON.stringify(value), propSchema as Schema);
              if (!propResult.isValid && propResult.errors) {
                errors.push(...propResult.errors.map(e => `${key}.${e}`));
              }
            }
          }
        }
      }

      // Array validation
      if (schema.type === 'array' && Array.isArray(data)) {
        if (schema.items) {
          data.forEach((item, index) => {
            const itemResult = this.validateSchema(JSON.stringify(item), schema.items!);
            if (!itemResult.isValid && itemResult.errors) {
              errors.push(...itemResult.errors.map(e => `[${index}].${e}`));
            }
          });
        }
      }

    } catch (error) {
      errors.push(`Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate multiple responses in parallel
   */
  validateBatch(responses: string[], rules: ValidationRules): ValidationResult[] {
    return responses.map(response => this.validate(response, rules));
  }

  private validateFormat(response: string, format: ValidationRules['format']): ValidationResult {
    const errors: string[] = [];

    switch (format) {
      case 'json':
        try {
          JSON.parse(response);
        } catch {
          errors.push('Invalid JSON format');
        }
        break;
      case 'yaml':
        // Basic YAML check - must start with --- or contain key: value pairs
        if (!response.includes(':') && !response.startsWith('---')) {
          errors.push('Invalid YAML format');
        }
        break;
      case 'markdown':
        // Check for markdown elements
        if (!response.includes('#') && !response.includes('**') && !response.includes('[')) {
          // Weak check - just warn if no markdown detected
          // Not adding error, just warning
        }
        break;
      case 'text':
        // Plain text - always valid
        break;
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateLength(response: string, maxLength?: number, minLength?: number): ValidationResult {
    const errors: string[] = [];
    const length = response.length;

    if (minLength !== undefined && length < minLength) {
      errors.push(`Response length ${length} is less than minimum ${minLength}`);
    }

    if (maxLength !== undefined && length > maxLength) {
      errors.push(`Response length ${length} exceeds maximum ${maxLength}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateWordCount(response: string, maxWords?: number, minWords?: number): ValidationResult {
    const errors: string[] = [];
    const words = response.split(/\s+/).filter(w => w.length > 0).length;

    if (minWords !== undefined && words < minWords) {
      errors.push(`Word count ${words} is less than minimum ${minWords}`);
    }

    if (maxWords !== undefined && words > maxWords) {
      errors.push(`Word count ${words} exceeds maximum ${maxWords}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateRequiredContent(response: string, required: string[]): ValidationResult {
    const errors: string[] = [];

    for (const term of required) {
      if (!response.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Required content "${term}" not found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateProhibitedContent(response: string, prohibited: string[]): ValidationResult {
    const errors: string[] = [];

    for (const term of prohibited) {
      if (response.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Prohibited content "${term}" found`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const formatIndex = args.indexOf('--format');
  
  if (inputIndex === -1) {
    console.error('Usage: npx ai-response-validator --input <file> [--format json|yaml|markdown|text]');
    process.exit(1);
  }

  const inputFile = args[inputIndex + 1];
  const format = formatIndex > -1 ? args[formatIndex + 1] : 'text';

  import('fs').then(fs => {
    const response = fs.readFileSync(inputFile, 'utf-8');
    const validator = new Validator();
    const result = validator.validate(response, { format: format as any });
    
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.isValid ? 0 : 1);
  });
}

export default Validator;
