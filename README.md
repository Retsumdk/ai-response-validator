# AI Response Validator

[![Build](https://github.com/Retsumdk/ai-response-validator/workflows/CI/badge.svg)](https://github.com/Retsumdk/ai-response-validator/actions)


A TypeScript tool to validate and verify AI responses against expected formats and constraints. Ensures AI outputs meet your requirements for format, length, structure, and content quality.

## Features

- **Format Validation**: Verify responses match JSON, YAML, Markdown, or custom formats
- **Schema Validation**: Validate against JSON Schema definitions
- **Length Constraints**: Check word count, character count, and token estimates
- **Content Quality**: Detect toxic content, profanity, and quality issues
- **Custom Rules**: Define custom validation rules with regex patterns
- **Batch Validation**: Validate multiple responses in parallel

## Installation

```bash
npm install ai-response-validator
```

Or clone and build:

```bash
git clone https://github.com/Retsumdk/ai-response-validator.git
cd ai-response-validator
npm install
npm run build
```

## Usage

### Basic Validation

```typescript
import { Validator } from 'ai-response-validator';

const validator = new Validator();

// Validate JSON format
const result = validator.validate('{"name": "test"}', {
  format: 'json'
});
console.log(result.isValid); // true

// Validate length
const lengthResult = validator.validate('Hello world', {
  maxLength: 100,
  minLength: 5
});
console.log(lengthResult.isValid); // true
```

### Schema Validation

```typescript
import { Validator, Schema } from 'ai-response-validator';

const userSchema: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name', 'email']
};

const validator = new Validator();
const result = validator.validateSchema(
  '{"name": "John", "email": "john@example.com", "age": 30}',
  userSchema
);
```

### Custom Rules

```typescript
import { Validator, ValidationRule } from 'ai-response-validator';

const customRule: ValidationRule = {
  name: 'no-placeholder',
  validate: (response: string) => {
    const hasPlaceholder = /\[.*?\]|\{.*?\}/.test(response);
    return {
      isValid: !hasPlaceholder,
      message: hasPlaceholder ? 'Response contains placeholders' : undefined
    };
  }
};

const validator = new Validator({ customRules: [customRule] });
```

## API Reference

### Validator Class

#### `new Validator(options?)`
Creates a new validator instance.

**Options:**
- `customRules` - Array of custom validation rules
- `defaultMaxLength` - Default maximum length (default: 10000)
- `defaultMinLength` - Default minimum length (default: 0)

#### `validate(response: string, rules: ValidationRules): ValidationResult`
Validate a response against the given rules.

#### `validateSchema(response: string, schema: Schema): ValidationResult`
Validate a response against a JSON schema.

#### `validateBatch(responses: string[], rules: ValidationRules): ValidationResult[]`
Validate multiple responses in parallel.

### Validation Rules

```typescript
interface ValidationRules {
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
```

## CLI Usage

```bash
# Validate a file
npx ai-response-validator validate --input response.txt --format json

# Validate with schema
npx ai-response-validator validate --input response.json --schema schema.json

# Batch validate
npx ai-response-validator batch --input responses/
```

## License

MIT License - see LICENSE file for details.
