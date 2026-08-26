import { Module } from '@nestjs/common';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { AdminProductionStepsController } from './admin-production-steps.controller';
import { ProductionStepsService } from './production-steps.service';

/** No public controller — Production Process content is snapshot-gated (see
 * `HomepageService.buildSnapshotPayload`); the public site reads it exclusively via
 * `GET /homepage/published-snapshot`, not a live per-entity endpoint here. */
@Module({
  imports: [AiTranslationModule],
  controllers: [AdminProductionStepsController],
  providers: [ProductionStepsService],
  exports: [ProductionStepsService],
})
export class ProductionStepsModule {}
