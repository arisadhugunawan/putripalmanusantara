import { Module } from '@nestjs/common';
import { AdminInventoryLotsController } from './admin-inventory-lots.controller';
import { InventoryLotsService } from './inventory-lots.service';

@Module({
  controllers: [AdminInventoryLotsController],
  providers: [InventoryLotsService],
  exports: [InventoryLotsService],
})
export class InventoryLotsModule {}
