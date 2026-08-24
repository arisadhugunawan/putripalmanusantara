import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiChatService } from './ai-chat.service';
import { AiSettingsService } from './ai-settings.service';
import { AiSyncService } from './ai-sync.service';
import { AdminAiTestRequestDto } from './dto/ai-chat.dto';
import { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import { SyncLogsQueryDto } from './dto/ai-sync-logs-query.dto';

@Controller('api/v1/admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAiController {
  constructor(
    private readonly settingsService: AiSettingsService,
    private readonly syncService: AiSyncService,
    private readonly chatService: AiChatService,
    private readonly analyticsService: AiAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('settings')
  findSettings() {
    return this.settingsService.findForAdmin();
  }

  // Controls what the public assistant is allowed to say (system instructions, which CMS
  // sources feed it, WhatsApp handoff) — an editor account changing this instantly changes
  // live AI behavior with no draft/review step, so it's restricted like Publish/Restore.
  @Put('settings')
  @Roles('super_admin')
  update(@Body() dto: UpdateAiSettingsDto) {
    return this.settingsService.update(dto);
  }

  @Get('sync-status')
  syncStatus() {
    return this.syncService.getStatus();
  }

  @Get('sync-logs')
  syncLogs(@Query() query: SyncLogsQueryDto) {
    return this.syncService.getLogs(query.limit);
  }

  @Get('sources')
  sources() {
    return this.syncService.getSourceSummary();
  }

  // Manual trigger (brief §T "[ Sync Now ]") — the automatic paths (publish hooks + scheduled
  // resync) remain the default; this exists for an admin who wants freshness on demand rather
  // than waiting for the next automatic pass.
  @Post('sync')
  async sync() {
    return this.syncService.runSync('manual');
  }

  // Admin → Test AI (brief §AV) — runs through the exact same retrieval + provider pipeline a
  // real visitor's message would, with a synthetic session id so it never mixes into real
  // visitor analytics/conversation history in a confusing way (still logged, just clearly
  // tagged, so an admin reviewing conversations can tell test traffic apart).
  @Post('test')
  async test(@Body() dto: AdminAiTestRequestDto) {
    const language = dto.language ?? 'en';
    const [result, status] = await Promise.all([
      this.chatService.chat({
        session_id: `admin-test-${Date.now()}`,
        message: dto.question,
        language,
        history: [],
      }),
      this.prisma.aiSyncStatus.findFirst(),
    ]);
    return {
      answer: result.reply,
      sources: result.sources,
      language,
      knowledge_version: status?.activeVersion?.toString() ?? null,
    };
  }

  @Get('analytics')
  analytics() {
    return this.analyticsService.getSummary();
  }
}
