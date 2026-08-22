import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GalleryQueryDto } from './gallery-query.dto';

function build(raw: Record<string, string>) {
  return plainToInstance(GalleryQueryDto, raw, {
    enableImplicitConversion: true,
  });
}

describe('GalleryQueryDto validation', () => {
  it('accepts a well-formed query', async () => {
    const dto = build({
      page: '1',
      limit: '50',
      category_id: 'cat-1',
      status: 'active',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects page < 1', async () => {
    const dto = build({ page: '0' });
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

  it('accepts an unrecognized category_id — invalid ids are a zero-result query, not a validation error, since category_id is an opaque foreign key, not a fixed enum', async () => {
    const dto = build({ category_id: 'does-not-exist' });
    expect(await validate(dto)).toHaveLength(0);
  });
});
