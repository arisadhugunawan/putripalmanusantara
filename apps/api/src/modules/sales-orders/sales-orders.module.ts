import { Module } from '@nestjs/common';
import { AdminSalesOrdersController } from './admin-sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  controllers: [AdminSalesOrdersController],
  providers: [SalesOrdersService],
})
export class SalesOrdersModule {}
