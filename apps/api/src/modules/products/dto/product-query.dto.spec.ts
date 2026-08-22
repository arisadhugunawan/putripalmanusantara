import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQueryDto } from './product-query.dto';

function build(raw: Record<string, string>) {
  return plainToInstance(ProductQueryDto, raw, {
    enableImplicitConversion: true,
  });
}

describe('ProductQueryDto validation', () => {
  it('accepts a well-formed query', async () => {
    const dto = build({
      page: '2',
      limit: '20',
      status: 'draft',
      featured: 'true',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects page < 1', async () => {
    const dto = build({ page: '0' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects a negative page', async () => {
    const dto = build({ page: '-1' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects limit > 50', async () => {
    const dto = build({ limit: '51' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const dto = build({ status: 'archived' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('rejects a featured value other than "true"/"false"', async () => {
    const dto = build({ featured: 'yes' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'featured')).toBe(true);
  });
});
