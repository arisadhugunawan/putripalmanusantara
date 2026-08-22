import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminArticleQueryDto } from './admin-article-query.dto';

function build(raw: Record<string, string>) {
  return plainToInstance(AdminArticleQueryDto, raw, {
    enableImplicitConversion: true,
  });
}

describe('AdminArticleQueryDto validation', () => {
  it('accepts a well-formed query', async () => {
    const dto = build({
      page: '1',
      limit: '20',
      status: 'published',
      content_type: 'website',
      sort: '-published_at',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects page < 1', async () => {
    const dto = build({ page: '0' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects limit > 50', async () => {
    const dto = build({ limit: '100' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const dto = build({ status: 'archived' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('rejects an invalid content_type', async () => {
    const dto = build({ content_type: 'facebook' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content_type')).toBe(true);
  });

  it('rejects an invalid sort value', async () => {
    const dto = build({ sort: 'random' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'sort')).toBe(true);
  });
});
