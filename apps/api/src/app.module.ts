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
import { ExternalAuthModule } from './external-auth/external-auth.module';
import { AboutCompanyModule } from './modules/about-company/about-company.module';
import { AiModule } from './modules/ai/ai.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { BrandingModule } from './modules/branding/branding.module';
import { BusinessRelationshipsModule } from './modules/business-relationships/business-relationships.module';
import { ContactPageModule } from './modules/contact-page/contact-page.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { FooterModule } from './modules/footer/footer.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InventoryLotsModule } from './modules/inventory-lots/inventory-lots.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { LeadsModule } from './modules/leads/leads.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { PageHeaderModule } from './modules/page-headers/page-header.module';
import { ProductionStepsModule } from './modules/production-steps/production-steps.module';
import { ProductsModule } from './modules/products/products.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { QcModule } from './modules/qc/qc.module';
import { PurchaseRequestsModule } from './modules/purchase-requests/purchase-requests.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ReceivingsModule } from './modules/receivings/receivings.module';
import { RfqsModule } from './modules/rfqs/rfqs.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { SalesQuotationsModule } from './modules/sales-quotations/sales-quotations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SupplierQuotationsModule } from './modules/supplier-quotations/supplier-quotations.module';
import { SupplierRfqsModule } from './modules/supplier-rfqs/supplier-rfqs.module';
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
    ExternalAuthModule,
    ProductsModule,
    ArticlesModule,
    BusinessRelationshipsModule,
    GalleryModule,
    ProductionStepsModule,
    SupplyNetworkModule,
    HomepageModule,
    InquiriesModule,
    LeadsModule,
    OpportunitiesModule,
    RfqsModule,
    SalesQuotationsModule,
    SalesOrdersModule,
    PurchaseRequestsModule,
    SupplierRfqsModule,
    SupplierQuotationsModule,
    PurchaseOrdersModule,
    ReceivingsModule,
    InventoryLotsModule,
    QcModule,
    InventoryModule,
    InventoryMovementsModule,
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
