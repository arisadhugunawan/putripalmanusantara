import { Module } from '@nestjs/common';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { MediaModule } from '../../media/media.module';
import { AdminPageHeaderController } from './admin-page-header.controller';
import { PageHeaderController } from './page-header.controller';
import { PageHeaderService } from './page-header.service';

@Module({
  imports: [MediaModule, AiTranslationModule],
  controllers: [PageHeaderController, AdminPageHeaderController],
  providers: [PageHeaderService],
})
export class PageHeaderModule {}
