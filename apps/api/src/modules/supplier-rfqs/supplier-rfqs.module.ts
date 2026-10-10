import { Module } from '@nestjs/common';
import { AdminSupplierRfqsController } from './admin-supplier-rfqs.controller';
import { SupplierRfqsService } from './supplier-rfqs.service';

@Module({
  controllers: [AdminSupplierRfqsController],
  providers: [SupplierRfqsService],
})
export class SupplierRfqsModule {}
