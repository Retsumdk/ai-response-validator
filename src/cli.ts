#!/usr/bin/env node
/**
 * ai-response-validator CLI
 *
 * Validates a response (read from a file argument or stdin) against
 * constraints supplied as flags, exiting 0 when valid and 1 when not.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import { Validator, ValidationRules, Schema } from './index';

interface CliOptions {
  format?: string;
  schema?: string;
  maxLength?: string;
  minLength?: string;
  maxWords?: string;
  minWords?: string;
  required?: string;
  prohibited?: string;
}

function buildRules(opts: CliOptions): ValidationRules {
  const rules: ValidationRules = {};

  if (opts.format) {
    rules.format = opts.format as ValidationRules['format'];
  }
  if (opts.schema) {
    const raw = fs.readFileSync(opts.schema, 'utf-8');
    rules.schema = JSON.parse(raw) as Schema;
  }
  if (opts.maxLength !== undefined) rules.maxLength = parseInt(opts.maxLength, 10);
  if (opts.minLength !== undefined) rules.minLength = parseInt(opts.minLength, 10);
  if (opts.maxWords !== undefined) rules.maxWords = parseInt(opts.maxWords, 10);
  if (opts.minWords !== undefined) rules.minWords = parseInt(opts.minWords, 10);
  if (opts.required) {
    rules.required = opts.required.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (opts.prohibited) {
    rules.prohibited = opts.prohibited.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return rules;
}

export async function runCli(argv: string[]): Promise<number> {
  const program = new Command();

  program
    .name('ai-response-validator')
    .description('Validate an AI response against format, length, and content constraints')
    .version('1.0.0')
    .argument('[file]', 'path to the response file (defaults to stdin)')
    .option('--format <format>', 'expected format: json | yaml | markdown | text')
    .option('--schema <file>', 'path to a JSON Schema file for structured validation')
    .option('--max-length <n>', 'maximum character length')
    .option('--min-length <n>', 'minimum character length')
    .option('--max-words <n>', 'maximum word count')
    .option('--min-words <n>', 'minimum word count')
    .option('--required <terms>', 'comma-separated terms that must appear')
    .option('--prohibited <terms>', 'comma-separated terms that must not appear')
    .parse(argv);

  const opts = program.opts<CliOptions>();
  const [file] = program.args;

  const response = file
    ? fs.readFileSync(file, 'utf-8')
    : fs.readFileSync(0, 'utf-8');

  const rules = buildRules(opts);
  const validator = new Validator();
  const result = validator.validate(response, rules);

  if (result.warnings && result.warnings.length > 0) {
    for (const warning of result.warnings) {
      process.stderr.write(`warning: ${warning}\n`);
    }
  }

  if (result.isValid) {
    process.stdout.write('valid\n');
    return 0;
  }

  for (const error of result.errors || []) {
    process.stderr.write(`error: ${error}\n`);
  }
  return 1;
}

if (require.main === module) {
  runCli(process.argv).then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(2);
    }
  );
}
