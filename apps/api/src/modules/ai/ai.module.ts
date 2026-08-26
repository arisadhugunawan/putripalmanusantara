import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AboutCompanyModule } from '../about-company/about-company.module';
import { ArticlesModule } from '../articles/articles.module';
import { ContactPageModule } from '../contact-page/contact-page.module';
import { GalleryModule } from '../gallery/gallery.module';
import { HomepageModule } from '../homepage/homepage.module';
import { ProductsModule } from '../products/products.module';
import { AdminAiController } from './admin-ai.controller';
import { AdminAiQuickQuestionsController } from './admin-ai-quick-questions.controller';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiChatService } from './ai-chat.service';
import { AiContentExtractorService } from './ai-content-extractor.service';
import { AiPublicController } from './ai-public.controller';
import { AiPublishSyncListener } from './ai-publish-sync.listener';
import { AiQuickQuestionsService } from './ai-quick-questions.service';
import { AiRetrievalService } from './ai-retrieval.service';
import { AiSettingsService } from './ai-settings.service';
import { AiSyncService } from './ai-sync.service';
import { AiWhatsappService } from './ai-whatsapp.service';
import { AiProviderModule } from './provider/ai-provider.module';

@Module({
  imports: [
    ConfigModule,
    AiProviderModule,
    HomepageModule,
    AboutCompanyModule,
    ProductsModule,
    GalleryModule,
    ArticlesModule,
    ContactPageModule,
  ],
  controllers: [
    AiPublicController,
    AdminAiController,
    AdminAiQuickQuestionsController,
  ],
  providers: [
    AiSettingsService,
    AiContentExtractorService,
    AiSyncService,
    AiPublishSyncListener,
    AiRetrievalService,
    AiChatService,
    AiQuickQuestionsService,
    AiAnalyticsService,
    AiWhatsappService,
  ],
})
export class AiModule {}
