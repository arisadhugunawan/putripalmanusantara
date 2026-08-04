import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { EmailModule } from './email/email.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { ProductionStepsModule } from './modules/production-steps/production-steps.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { RevalidationModule } from './revalidation/revalidation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    FacilitiesModule,
    ProductionStepsModule,
    HomepageModule,
    FaqsModule,
    SettingsModule,
    QuotationsModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
