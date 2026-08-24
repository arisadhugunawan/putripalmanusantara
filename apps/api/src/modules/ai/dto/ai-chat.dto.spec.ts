import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminAiTestRequestDto } from './ai-chat.dto';

function build(raw: Record<string, unknown>) {
  return plainToInstance(AdminAiTestRequestDto, raw, {
    enableImplicitConversion: true,
  });
}

// P0.4-D2 — mirrors AiChatRequestDto's `message` validation for the admin "Test AI" endpoint,
// which previously took an unvalidated raw @Body('question').
describe('AdminAiTestRequestDto validation', () => {
  it('rejects a missing question', async () => {
    const dto = build({});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'question')).toBe(true);
  });

  it('a non-string question (e.g. a number or object) is coerced to a string, not rejected', async () => {
    // The global ValidationPipe uses `enableImplicitConversion: true` (src/main.ts), which
    // calls String(value) on any value for a string-typed field before IsString() ever runs —
    // so "non-string" and "missing" collapse to the same case here for every field of this
    // shape, exactly as they already do for AiChatRequestDto.message above. Documented rather
    // than asserted as a rejection, since a rejection can't actually be reached this way.
    const dto = build({ question: { not: 'a string' } });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.question).toBe('[object Object]');
  });

  it('rejects a question over 1000 characters', async () => {
    const dto = build({ question: 'a'.repeat(1001) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'question')).toBe(true);
  });

  it('accepts a valid question with no errors', async () => {
    const dto = build({ question: 'What is your return policy?' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid question with an optional language', async () => {
    const dto = build({ question: 'Berapa lama pengiriman?', language: 'id' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('an oversized language value is rejected by MaxLength once coerced to a string', async () => {
    const dto = build({
      question: 'Valid question',
      language: 'english-not-a-code',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'language')).toBe(true);
  });
});
