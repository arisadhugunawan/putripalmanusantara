import { Module } from '@nestjs/common';
import { AdminInventoryMovementsController } from './admin-inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';

@Module({
  controllers: [AdminInventoryMovementsController],
  providers: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
