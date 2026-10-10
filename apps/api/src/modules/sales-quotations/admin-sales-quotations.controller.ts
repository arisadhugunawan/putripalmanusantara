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
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationQueryDto } from './dto/quotation-query.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { SalesQuotationsService } from './sales-quotations.service';

// No `RolesGuard`/`@Roles` — CRM CRUD stays open to editor and super_admin equally, matching
// AdminRfqsController's/AdminOpportunitiesController's exact precedent. No standalone POST (a
// Quotation only ever exists as a conversion of an RFQ — locked decision 2), no DELETE, and no
// item-level routes — Quotation items are fixed at creation time for v1 (locked decision 20).
@Controller('api/v1/admin/quotations')
@UseGuards(JwtAuthGuard)
export class AdminSalesQuotationsController {
  constructor(
    private readonly salesQuotationsService: SalesQuotationsService,
  ) {}

  @Get()
  findAll(@Query() query: QuotationQueryDto) {
    return this.salesQuotationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesQuotationsService.findOne(id);
  }

  @Post('from-rfq/:rfqId')
  @HttpCode(HttpStatus.CREATED)
  createFromRfq(
    @Param('rfqId') rfqId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.salesQuotationsService.createFromRfq(rfqId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.salesQuotationsService.update(id, dto);
  }
}
