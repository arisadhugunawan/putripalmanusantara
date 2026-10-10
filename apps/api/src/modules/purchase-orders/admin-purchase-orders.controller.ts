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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

// No `RolesGuard`/`@Roles`, no DELETE, no standalone POST — a PurchaseOrder only ever exists
// as a conversion of a `selected` SupplierQuotation in v1 (locked decision 6).
@Controller('api/v1/admin/purchase-orders')
@UseGuards(JwtAuthGuard)
export class AdminPurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post('from-supplier-quotation/:supplierQuotationId')
  @HttpCode(HttpStatus.CREATED)
  createFromSupplierQuotation(
    @Param('supplierQuotationId') supplierQuotationId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.createFromSupplierQuotation(
      supplierQuotationId,
      dto,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }
}
