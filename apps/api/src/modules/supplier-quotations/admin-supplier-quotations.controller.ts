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
import { CreateSupplierQuotationDto } from './dto/create-supplier-quotation.dto';
import { SupplierQuotationQueryDto } from './dto/supplier-quotation-query.dto';
import { UpdateSupplierQuotationDto } from './dto/update-supplier-quotation.dto';
import { SupplierQuotationsService } from './supplier-quotations.service';

// No `RolesGuard`/`@Roles`, no DELETE, no standalone POST — a SupplierQuotation only ever
// exists as a conversion of a SupplierRFQ.
@Controller('api/v1/admin/supplier-quotations')
@UseGuards(JwtAuthGuard)
export class AdminSupplierQuotationsController {
  constructor(
    private readonly supplierQuotationsService: SupplierQuotationsService,
  ) {}

  @Get()
  findAll(@Query() query: SupplierQuotationQueryDto) {
    return this.supplierQuotationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierQuotationsService.findOne(id);
  }

  @Post('from-supplier-rfq/:supplierRfqId')
  @HttpCode(HttpStatus.CREATED)
  createFromSupplierRfq(
    @Param('supplierRfqId') supplierRfqId: string,
    @Body() dto: CreateSupplierQuotationDto,
  ) {
    return this.supplierQuotationsService.createFromSupplierRfq(
      supplierRfqId,
      dto,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierQuotationDto) {
    return this.supplierQuotationsService.update(id, dto);
  }
}
