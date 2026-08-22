import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AiAnalyticsEventType } from '@ppn/shared-types';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiChatService } from './ai-chat.service';
import { AiQuickQuestionsService } from './ai-quick-questions.service';
import { AiSettingsService } from './ai-settings.service';
import { AiWhatsappService } from './ai-whatsapp.service';
import { AiChatRequestDto } from './dto/ai-chat.dto';

const PUBLIC_EVENT_TYPES: AiAnalyticsEventType[] = [
  'chat_opened',
  'quick_question_clicked',
  'whatsapp_clicked',
];

@Controller('api/v1/ai')
export class AiPublicController {
  constructor(
    private readonly settingsService: AiSettingsService,
    private readonly quickQuestionsService: AiQuickQuestionsService,
    private readonly chatService: AiChatService,
    private readonly analyticsService: AiAnalyticsService,
    private readonly whatsappService: AiWhatsappService,
  ) {}

  @Get('settings')
  findSettings() {
    return this.settingsService.findPublic();
  }

  @Get('quick-questions')
  findQuickQuestions(@Query('language') language = 'en') {
    return this.quickQuestionsService.findPublic(language);
  }

  // A visitor typing quickly could otherwise fire many LLM calls in a burst — 20/min is
  // generous for real conversation use while bounding cost (brief §Z/§AS).
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @Post('chat')
  chat(@Body() dto: AiChatRequestDto) {
    return this.chatService.chat(dto);
  }

  @Post('analytics/event')
  recordEvent(
    @Body('event_type') eventType: string,
    @Body('session_id') sessionId: string,
    @Body('language') language?: string,
    @Body('product_id') productId?: string,
  ) {
    if (
      !PUBLIC_EVENT_TYPES.includes(eventType as AiAnalyticsEventType) ||
      !sessionId
    ) {
      return { recorded: false };
    }
    return this.analyticsService.recordEvent(
      eventType as AiAnalyticsEventType,
      sessionId,
      language,
      productId,
    );
  }

  @Post('whatsapp/generate')
  generateWhatsapp(
    @Body('product_slug') productSlug?: string,
    @Body('language') language?: string,
  ) {
    return this.whatsappService.generate({ productSlug, language });
  }
}
