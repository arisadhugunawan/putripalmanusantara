import { Logger } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AiSettingsService } from './ai-settings.service';
import type { AiRetrievalService } from './ai-retrieval.service';
import type { ProductsService } from '../products/products.service';

function buildService() {
  const prisma = {
    aiSyncStatus: { findFirst: jest.fn<Promise<unknown>, unknown[]>() },
    aiConversationMessage: {
      create: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue({}),
    },
    aiAnalyticsEvent: {
      create: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue({}),
    },
  };
  const settingsService = {
    getOrCreateRaw: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const retrieval = {
    search: jest.fn<Promise<unknown[]>, unknown[]>(),
    fallbackForProduct: jest.fn<Promise<unknown[]>, unknown[]>(),
  };
  const productsService = {
    findPublishedBySlug: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const provider = {
    isConfigured: jest.fn<boolean, unknown[]>(),
    generateReply: jest.fn<Promise<string>, unknown[]>(),
  };
  const service = new AiChatService(
    prisma as unknown as PrismaService,
    settingsService as unknown as AiSettingsService,
    retrieval as unknown as AiRetrievalService,
    productsService as unknown as ProductsService,
    provider,
  );
  return {
    service,
    prisma,
    settingsService,
    retrieval,
    productsService,
    provider,
  };
}

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    session_id: 'sess-1',
    message: 'Hello',
    language: 'en',
    history: [],
    ...overrides,
  };
}

describe('AiChatService — analytics-write logging (P0.4-D3)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('question_submitted analytics write failure logs a warning and does not throw', async () => {
    const { service, prisma, settingsService, provider } = buildService();
    settingsService.getOrCreateRaw.mockResolvedValue({
      enabled: true,
      businessInstructions: '',
      whatsappNumber: '',
    });
    prisma.aiSyncStatus.findFirst.mockResolvedValue(null);
    provider.isConfigured.mockReturnValue(false);
    prisma.aiAnalyticsEvent.create.mockRejectedValueOnce(new Error('db down'));

    await expect(service.chat(baseRequest())).resolves.toBeDefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('question_submitted'),
    );
  });

  it('quotation_intent analytics write failure logs a warning and does not throw', async () => {
    const { service, prisma, settingsService, provider } = buildService();
    settingsService.getOrCreateRaw.mockResolvedValue({
      enabled: true,
      businessInstructions: '',
      whatsappNumber: '',
    });
    prisma.aiSyncStatus.findFirst.mockResolvedValue(null);
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue('Sure, here is more information.');
    // 1st call = question_submitted (from the initial user-role logMessage), resolves normally;
    // 2nd call = quotation_intent (this finding's target write), rejects.
    prisma.aiAnalyticsEvent.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('db down'));

    const result = await service.chat(
      baseRequest({ message: 'I need a quotation for 5 containers' }),
    );

    expect(result.quotation_intent).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('quotation_intent'),
    );
  });

  it('successful analytics writes never call logger.warn (regression guard)', async () => {
    const { service, prisma, settingsService, provider } = buildService();
    settingsService.getOrCreateRaw.mockResolvedValue({
      enabled: true,
      businessInstructions: '',
      whatsappNumber: '',
    });
    prisma.aiSyncStatus.findFirst.mockResolvedValue(null);
    provider.isConfigured.mockReturnValue(false);

    await service.chat(baseRequest());

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('the unrelated page-context product lookup .catch(() => null) is untouched — a rejected lookup still degrades gracefully, not logged here', async () => {
    const { service, prisma, settingsService, productsService, provider } =
      buildService();
    settingsService.getOrCreateRaw.mockResolvedValue({
      enabled: true,
      businessInstructions: '',
      whatsappNumber: '',
    });
    prisma.aiSyncStatus.findFirst.mockResolvedValue(null);
    provider.isConfigured.mockReturnValue(false);
    productsService.findPublishedBySlug.mockRejectedValue(
      new Error('lookup failed'),
    );

    await expect(
      service.chat(
        baseRequest({
          page_context: { path: '/products/foo', product_slug: 'foo' },
        }),
      ),
    ).resolves.toBeDefined();

    // Only the two analytics-write catches (P0.4-D3) log; the page-context read catch is
    // deliberately silent, unchanged, and out of scope.
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('lookup failed'),
    );
  });
});
