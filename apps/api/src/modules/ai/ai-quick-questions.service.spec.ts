import { AiQuickQuestionsService } from './ai-quick-questions.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const aiQuickQuestion = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    aggregate: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    delete: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = {
    aiQuickQuestion,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return {
    service: new AiQuickQuestionsService(prisma as unknown as PrismaService),
    aiQuickQuestion,
  };
}

function stubQuestionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q1',
    label: 'Shipping',
    question: 'How long does shipping take?',
    language: 'en',
    active: true,
    order: 0,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

// P0.4-D2 — reorder() previously ran straight into a $transaction of per-id updates with no
// existence check at all, unlike update()/remove() in this same file (both call assertExists()
// first). A stale id (deleted in another tab) fell through to an unhandled Prisma P2025 → raw
// 500 instead of a clean 404.
describe('AiQuickQuestionsService.reorder — existence validation (P0.4-D2)', () => {
  it('throws NOT_FOUND (404) when one of the ordered ids no longer exists', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findMany.mockResolvedValue([{ id: 'q1' }]); // only q1 actually exists

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.reorder(['q1', 'q2-deleted']);
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('NOT_FOUND');
    expect(thrown?.getStatus?.()).toBe(404);
  });

  it('does not attempt the reorder transaction when an id is missing', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findMany.mockResolvedValue([{ id: 'q1' }]);

    await expect(service.reorder(['q1', 'q2-deleted'])).rejects.toThrow();

    expect(aiQuickQuestion.update).not.toHaveBeenCalled();
  });

  it('a fully valid reorder proceeds exactly as before', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findMany
      .mockResolvedValueOnce([{ id: 'q1' }, { id: 'q2' }]) // existence check
      .mockResolvedValueOnce([
        stubQuestionRow({ id: 'q2', order: 0 }),
        stubQuestionRow({ id: 'q1', order: 1 }),
      ]); // findAllForAdmin() at the end
    aiQuickQuestion.update.mockResolvedValue({});

    const result = await service.reorder(['q2', 'q1']);

    expect(aiQuickQuestion.update).toHaveBeenCalledTimes(2);
    expect(aiQuickQuestion.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'q2' },
      data: { order: 0 },
    });
    expect(aiQuickQuestion.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'q1' },
      data: { order: 1 },
    });
    expect(result).toHaveLength(2);
  });

  it('an empty ordered_ids array is a safe no-op (nothing missing, nothing to reorder)', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findMany
      .mockResolvedValueOnce([]) // existence check over zero ids
      .mockResolvedValueOnce([]); // findAllForAdmin()

    const result = await service.reorder([]);

    expect(aiQuickQuestion.update).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe('AiQuickQuestionsService.update / remove — existing NOT_FOUND behavior unchanged', () => {
  it('update() still 404s via assertExists() for a nonexistent id', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findUnique.mockResolvedValue(null);

    await expect(
      service.update('missing', { label: 'New label' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('remove() still 404s via assertExists() for a nonexistent id', async () => {
    const { service, aiQuickQuestion } = buildService();
    aiQuickQuestion.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
