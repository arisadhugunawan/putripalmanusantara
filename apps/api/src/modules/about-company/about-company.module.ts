import { Module } from '@nestjs/common';
import { MediaModule } from '../../media/media.module';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { AboutCompanyController } from './about-company.controller';
import { AboutCompanyService } from './about-company.service';
import { AdminAboutCompanyController } from './admin-about-company.controller';

@Module({
  imports: [MediaModule, AiTranslationModule],
  controllers: [AboutCompanyController, AdminAboutCompanyController],
  providers: [AboutCompanyService],
  exports: [AboutCompanyService],
})
export class AboutCompanyModule {}
