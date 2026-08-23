import { ApiException } from '../../common/exceptions/api.exception';
import { FaqsService } from './faqs.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const faq = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    delete: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = { faq };
  return {
    service: new FaqsService(prisma as unknown as PrismaService),
    faq,
  };
}

function stubFaqRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'faq-1',
    question: 'Question EN',
    answer: 'Answer EN',
    order: 0,
    status: 'published',
    translations: null,
    ...overrides,
  };
}

describe('FaqsService.findPublished — translate() wiring', () => {
  it('resolves question/answer per locale and omits the raw translations blob', async () => {
    const { service, faq } = buildService();
    faq.findMany.mockResolvedValue([
      stubFaqRow({
        translations: {
          id: { question: 'Pertanyaan ID', answer: 'Jawaban ID' },
        },
      }),
    ]);

    const result = await service.findPublished('id');

    expect(result[0]).toEqual({
      id: 'faq-1',
      question: 'Pertanyaan ID',
      answer: 'Jawaban ID',
      order: 0,
      status: 'published',
    });
    expect(result[0]).not.toHaveProperty('translations');
  });
});

// Phase 5F-P0.3-A — FAQ had zero automated test coverage before this phase (confirmed by the
// P0.3 translation audit). update() previously wrote `translations: dto.translations` as a
// straight column replace; it now merges against the row's existing translations first.
describe('FaqsService.update — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, faq } = buildService();
    faq.findUnique.mockResolvedValue(
      stubFaqRow({
        translations: {
          id: { question: 'Pertanyaan ID', answer: 'Jawaban ID' },
          zh: { question: '问题 ZH', answer: '答案 ZH' },
        },
      }),
    );
    faq.update.mockResolvedValue(stubFaqRow());

    await service.update('faq-1', {
      translations: { th: { question: 'คำถาม TH' } },
    });

    const [call] = faq.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ question: 'คำถาม TH' });
    expect(call.data.translations.id).toEqual({
      question: 'Pertanyaan ID',
      answer: 'Jawaban ID',
    });
    expect(call.data.translations.zh).toEqual({
      question: '问题 ZH',
      answer: '答案 ZH',
    });
  });

  it('a single-field edit within one locale preserves the sibling field already saved for that locale', async () => {
    const { service, faq } = buildService();
    faq.findUnique.mockResolvedValue(
      stubFaqRow({
        translations: { th: { question: 'คำถามเดิม', answer: 'คำตอบเดิม' } },
      }),
    );
    faq.update.mockResolvedValue(stubFaqRow());

    await service.update('faq-1', {
      translations: { th: { question: 'คำถามใหม่' } },
    });

    const [call] = faq.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      question: 'คำถามใหม่',
      answer: 'คำตอบเดิม',
    });
  });

  it('omitting translations from the patch leaves the column untouched', async () => {
    const { service, faq } = buildService();
    faq.findUnique.mockResolvedValue(
      stubFaqRow({ translations: { id: { question: 'Q' } } }),
    );
    faq.update.mockResolvedValue(stubFaqRow());

    await service.update('faq-1', { question: 'New question' });

    const [call] = faq.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('throws NOT_FOUND before attempting any update when the FAQ does not exist', async () => {
    const { service, faq } = buildService();
    faq.findUnique.mockResolvedValue(null);

    await expect(
      service.update('nonexistent', { question: 'x' }),
    ).rejects.toThrow(ApiException);
    expect(faq.update).not.toHaveBeenCalled();
  });
});
