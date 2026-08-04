import { Module } from '@nestjs/common';
import { AdminProductionStepsController } from './admin-production-steps.controller';
import { ProductionStepsController } from './production-steps.controller';
import { ProductionStepsService } from './production-steps.service';

@Module({
  controllers: [ProductionStepsController, AdminProductionStepsController],
  providers: [ProductionStepsService],
})
export class ProductionStepsModule {}
