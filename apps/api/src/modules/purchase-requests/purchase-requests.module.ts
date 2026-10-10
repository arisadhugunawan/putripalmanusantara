import { Module } from '@nestjs/common';
import { AdminPurchaseRequestsController } from './admin-purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';

@Module({
  controllers: [AdminPurchaseRequestsController],
  providers: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
