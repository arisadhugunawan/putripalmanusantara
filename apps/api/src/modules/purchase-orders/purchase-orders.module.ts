import { Module } from '@nestjs/common';
import { AdminPurchaseOrdersController } from './admin-purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  controllers: [AdminPurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
