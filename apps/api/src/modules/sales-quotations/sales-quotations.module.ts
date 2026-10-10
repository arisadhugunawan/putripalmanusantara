import { Module } from '@nestjs/common';
import { AdminSalesQuotationsController } from './admin-sales-quotations.controller';
import { SalesQuotationsService } from './sales-quotations.service';

// Implements the CRM "Quotation Application" (Phase 20). Named `sales-quotations` rather than
// the literally-instructed `quotations` because `src/modules/quotations/` is already occupied
// by the pre-existing, protected public `QuotationRequest` feature — see the Phase 20 report's
// deviation note. The API route itself is unaffected: still exactly `/api/v1/admin/quotations`.
@Module({
  controllers: [AdminSalesQuotationsController],
  providers: [SalesQuotationsService],
})
export class SalesQuotationsModule {}
