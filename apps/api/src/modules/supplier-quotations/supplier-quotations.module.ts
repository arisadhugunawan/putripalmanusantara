import { Module } from '@nestjs/common';
import { AdminSupplierQuotationsController } from './admin-supplier-quotations.controller';
import { SupplierQuotationsService } from './supplier-quotations.service';

@Module({
  controllers: [AdminSupplierQuotationsController],
  providers: [SupplierQuotationsService],
})
export class SupplierQuotationsModule {}
