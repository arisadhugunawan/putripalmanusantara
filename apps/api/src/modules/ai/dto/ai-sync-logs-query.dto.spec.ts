import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SyncLogsQueryDto } from './ai-sync-logs-query.dto';

function build(raw: Record<string, unknown>) {
  return plainToInstance(SyncLogsQueryDto, raw, {
    enableImplicitConversion: true,
  });
}

// P0.4-D3 — syncLogs() previously parsed `@Query('limit')` via a bare `Number(limit)`; a
// non-numeric value became NaN and reached Prisma's `take` unvalidated.
describe('SyncLogsQueryDto validation', () => {
  it('rejects a non-numeric limit', async () => {
    const dto = build({ limit: 'abc' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects a limit below 1', async () => {
    const dto = build({ limit: '0' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects a limit above 100', async () => {
    const dto = build({ limit: '101' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('accepts a valid numeric limit and converts it to a number', async () => {
    const dto = build({ limit: '50' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(50);
  });

  it('omitted limit is valid and stays undefined (service applies its own default of 20)', async () => {
    const dto = build({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBeUndefined();
  });
});
