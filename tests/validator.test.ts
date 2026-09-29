import { Validator } from '../src/index';

describe('Validator', () => {
  const v = new Validator();

  test('valid JSON passes format validation', () => {
    const r = v.validate('{"ok": true, "n": 3}', { format: 'json' });
    expect(r.isValid).toBe(true);
    expect(r.errors).toBeUndefined();
  });

  test('invalid JSON is reported', () => {
    const r = v.validate('{not json', { format: 'json' });
    expect(r.isValid).toBe(false);
    expect(r.errors![0].toLowerCase()).toContain('json');
  });

  test('length and word-count bounds are enforced', () => {
    expect(v.validate('hi', { minLength: 5 }).isValid).toBe(false);
    expect(v.validate('a'.repeat(50), { maxLength: 10 }).isValid).toBe(false);
    expect(v.validate('one two three', { minWords: 2, maxWords: 5 }).isValid).toBe(true);
    expect(v.validate('one', { minWords: 2 }).isValid).toBe(false);
  });

  test('required and prohibited content checks', () => {
    expect(v.validate('The answer is Paris.', { required: ['Paris'] }).isValid).toBe(true);
    expect(v.validate('The answer is Lyon.', { required: ['Paris'] }).isValid).toBe(false);
    expect(v.validate('no secrets here', { prohibited: ['secret'] }).isValid).toBe(false);
  });

  test('schema validation catches type and required-field errors', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'number' } },
      required: ['name'],
    };
    expect(v.validateSchema('{"name": "Ada", "age": 36}', schema).isValid).toBe(true);
    expect(v.validateSchema('{"age": 36}', schema).isValid).toBe(false);
    expect(v.validateSchema('{"name": "Ada", "age": "old"}', schema).isValid).toBe(false);
  });

  test('custom rules run alongside built-ins', () => {
    const withCustom = new Validator({
      customRules: [{
        name: 'no-shouting',
        validate: (response) => response.includes('!!!')
          ? { isValid: false, message: 'Do not shout' }
          : { isValid: true },
      }],
    });
    expect(withCustom.validate('fine', {}).isValid).toBe(true);
    expect(withCustom.validate('FINE!!!', {}).isValid).toBe(false);
  });
});
