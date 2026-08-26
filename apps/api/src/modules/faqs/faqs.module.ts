import { Module } from '@nestjs/common';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { AdminFaqsController } from './admin-faqs.controller';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [AiTranslationModule],
  controllers: [FaqsController, AdminFaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
