import { Module } from '@nestjs/common';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { MediaModule } from '../../media/media.module';
import { AdminFooterController } from './admin-footer.controller';
import { FooterController } from './footer.controller';
import { FooterService } from './footer.service';

@Module({
  imports: [MediaModule, AiTranslationModule],
  controllers: [FooterController, AdminFooterController],
  providers: [FooterService],
})
export class FooterModule {}
