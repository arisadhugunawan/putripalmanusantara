import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiChatRequest, AiChatResponse } from '@ppn/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { AiSettingsService } from './ai-settings.service';
import { AiRetrievalService } from './ai-retrieval.service';
import { AI_PROVIDER, type AiProvider } from './provider/ai-provider.interface';
import {
  buildSystemPrompt,
  detectQuotationIntent,
  toChatSources,
  unavailableFallback,
} from './ai-system-prompt';

const TOP_K = 5;
const MAX_OUTPUT_TOKENS = 600;
const MAX_HISTORY_TURNS = 6;
const MAX_MESSAGE_LENGTH = 1000;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: AiSettingsService,
    private readonly retrieval: AiRetrievalService,
    private readonly productsService: ProductsService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const settings = await this.settingsService.getOrCreateRaw();
    const message = request.message.trim().slice(0, MAX_MESSAGE_LENGTH);
    const language = request.language || 'en';

    if (!settings.enabled) {
      return {
        reply: unavailableFallback(language),
        sources: [],
        quotation_intent: false,
      };
    }

    await this.logMessage(
      request.session_id,
      'user',
      message,
      language,
      request,
    );

    let productId: string | null = null;
    let productName: string | null = null;
    if (request.page_context?.product_slug) {
      const product = await this.productsService
        .findPublishedBySlug(request.page_context.product_slug, language)
        .catch(() => null);
      if (product) {
        productId = product.id;
        productName = product.name;
      }
    }

    const status = await this.prisma.aiSyncStatus.findFirst();
    let retrieved = status?.activeVersion
      ? await this.retrieval.search({
          query: message,
          language,
          activeVersion: status.activeVersion,
          productId,
          topK: TOP_K,
        })
      : [];

    if (retrieved.length === 0 && productId && status?.activeVersion) {
      retrieved = await this.retrieval.fallbackForProduct({
        productId,
        language,
        activeVersion: status.activeVersion,
        topK: 3,
      });
    }

    if (!this.provider.isConfigured()) {
      const reply = unavailableFallback(language);
      await this.logMessage(
        request.session_id,
        'assistant',
        reply,
        language,
        request,
        0,
      );
      return { reply, sources: [], quotation_intent: false };
    }

    const systemPrompt = buildSystemPrompt({
      businessInstructions: settings.businessInstructions,
      language,
      retrievedContent: retrieved.map((r) => ({
        sourceUrl: r.sourceUrl,
        content: r.content,
      })),
      pageContext: request.page_context
        ? { path: request.page_context.path, productName }
        : null,
      whatsappNumber: settings.whatsappNumber,
    });

    const history = request.history.slice(-MAX_HISTORY_TURNS).map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }));

    let reply: string;
    try {
      reply = await this.provider.generateReply({
        systemPrompt,
        history,
        userMessage: message,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      if (!reply.trim()) reply = unavailableFallback(language);
    } catch (err) {
      this.logger.error(`AI provider call failed: ${(err as Error).message}`);
      reply = unavailableFallback(language);
    }

    const quotationIntent = detectQuotationIntent(message);
    await this.logMessage(
      request.session_id,
      'assistant',
      reply,
      language,
      request,
      retrieved.length,
    );
    if (quotationIntent) {
      await this.prisma.aiAnalyticsEvent
        .create({
          data: {
            eventType: 'quotation_intent',
            sessionId: request.session_id,
            language,
            productId,
          },
        })
        .catch((err) =>
          this.logger.warn(
            `Failed to log quotation_intent analytics event: ${(err as Error).message}`,
          ),
        );
    }

    return {
      reply,
      sources: toChatSources(
        retrieved.map((r) => ({
          sourceUrl: r.sourceUrl,
          page: r.page,
          section: r.section,
        })),
      ),
      quotation_intent: quotationIntent,
    };
  }

  private async logMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    language: string,
    request: AiChatRequest,
    sourcesUsed = 0,
  ) {
    await this.prisma.aiConversationMessage
      .create({
        data: {
          sessionId,
          role,
          content,
          language,
          pageContext: request.page_context?.path ?? null,
          productId: null,
          sourcesUsed,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Failed to log conversation message: ${(err as Error).message}`,
        ),
      );
    if (role === 'user') {
      await this.prisma.aiAnalyticsEvent
        .create({
          data: { eventType: 'question_submitted', sessionId, language },
        })
        .catch((err) =>
          this.logger.warn(
            `Failed to log question_submitted analytics event: ${(err as Error).message}`,
          ),
        );
    }
  }
}
