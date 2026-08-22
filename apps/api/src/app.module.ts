import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ActivityLogModule } from './common/activity-log/activity-log.module';
import { ActivityLogInterceptor } from './common/activity-log/activity-log.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { EmailModule } from './email/email.module';
import { AboutCompanyModule } from './modules/about-company/about-company.module';
import { AiModule } from './modules/ai/ai.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { BrandingModule } from './modules/branding/branding.module';
import { ContactPageModule } from './modules/contact-page/contact-page.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { FooterModule } from './modules/footer/footer.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { PageHeaderModule } from './modules/page-headers/page-header.module';
import { ProductionStepsModule } from './modules/production-steps/production-steps.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SupplyNetworkModule } from './modules/supply-network/supply-network.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { RevalidationModule } from './revalidation/revalidation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Registered once, globally — content modules emit `content.published` (see
    // `common/events/content-published.event.ts`) without importing anything AI-related;
    // `AiModule`'s own listener is the only thing that knows AI exists and subscribes.
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60 * 1000, limit: 100 }],
    }),
    PrismaModule,
    EmailModule,
    RevalidationModule,
    AuthModule,
    ProductsModule,
    ArticlesModule,
    GalleryModule,
    ProductionStepsModule,
    SupplyNetworkModule,
    HomepageModule,
    FaqsModule,
    SettingsModule,
    BrandingModule,
    AboutCompanyModule,
    ContactPageModule,
    QuotationsModule,
    MediaModule,
    PageHeaderModule,
    FooterModule,
    AiModule,
    ActivityLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
