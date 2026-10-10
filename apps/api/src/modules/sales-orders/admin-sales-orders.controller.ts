import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { SalesOrderQueryDto } from './dto/sales-order-query.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrdersService } from './sales-orders.service';

// No `RolesGuard`/`@Roles` — CRM/Sales CRUD stays open to editor and super_admin equally,
// matching AdminSalesQuotationsController's/AdminRfqsController's exact precedent. No
// standalone POST (a SalesOrder only ever exists as a conversion of an accepted Quotation —
// locked decision 1), no DELETE, and no item-level routes — SalesOrder items are fixed at
// creation time for v1 (locked decision 33).
@Controller('api/v1/admin/sales-orders')
@UseGuards(JwtAuthGuard)
export class AdminSalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  findAll(@Query() query: SalesOrderQueryDto) {
    return this.salesOrdersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesOrdersService.findOne(id);
  }

  @Post('from-quotation/:quotationId')
  @HttpCode(HttpStatus.CREATED)
  createFromQuotation(
    @Param('quotationId') quotationId: string,
    @Body() dto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.createFromQuotation(quotationId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.salesOrdersService.update(id, dto);
  }
}
