import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AI_PROVIDER } from './provider/ai-provider.interface';
import { AnthropicProvider } from './provider/anthropic.provider';

@Module({
  imports: [
    ConfigModule,
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
    {
      // Provider abstraction (brief §AR) — only this one factory line knows the current
      // provider is Anthropic; everything else depends on the `AiProvider` interface.
      provide: AI_PROVIDER,
      inject: [ConfigService, AnthropicProvider],
      useFactory: (config: ConfigService, anthropic: AnthropicProvider) => {
        const selected = config.get<string>('AI_PROVIDER', 'anthropic');
        if (selected !== 'anthropic') {
          throw new Error(
            `Unknown AI_PROVIDER "${selected}" — only "anthropic" is implemented.`,
          );
        }
        return anthropic;
      },
    },
    AnthropicProvider,
  ],
})
export class AiModule {}
