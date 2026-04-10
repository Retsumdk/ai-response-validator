# AI Response Validator

[![Build](https://github.com/Retsumdk/ai-response-validator/workflows/CI/badge.svg)](https://github.com/Retsumdk/ai-response-validator/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933.svg)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.0.0-orange.svg)](https://github.com/Retsumdk/ai-response-validator/releases/tag/v1.0.0)

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

// Validate format
const result = await validator.validate({
  content: 'Generated response text',
  constraints: {
    format: 'json',
    maxLength: 1000,
    schema: jsonSchema
  }
});
```

## 🔗 Related Repos

- [ai-prompt-optimizer](https://github.com/Retsumdk/ai-prompt-optimizer) — Optimize AI prompts
- [prompt-version-control](https://github.com/Retsumdk/prompt-version-control) — Version control for prompts
- [agent-workflow-orchestrator](https://github.com/Retsumdk/agent-workflow-orchestrator) — Orchestrate workflows

## License

MIT License - see [LICENSE](LICENSE) for details.
