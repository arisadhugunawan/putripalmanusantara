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
import { CreateSupplierRfqDto } from './dto/create-supplier-rfq.dto';
import { SupplierRfqQueryDto } from './dto/supplier-rfq-query.dto';
import { UpdateSupplierRfqDto } from './dto/update-supplier-rfq.dto';
import { SupplierRfqsService } from './supplier-rfqs.service';

// No `RolesGuard`/`@Roles`, no DELETE — same precedent as every other CRM/Sales/Procurement
// controller. Creation is implemented ONLY as `from-purchase-request/:purchaseRequestId`: this
// also performs the PurchaseRequest's `approved → converted` conversion as one atomic
// transaction (SupplierRfqsService.createFromPurchaseRequest). A bare standalone
// `POST /api/v1/admin/supplier-rfqs` was deliberately not implemented — unlike RFQ's own
// standalone path (which exists because `RFQ.opportunityId` is nullable), `SupplierRFQ.
// purchaseRequestId` is required at the schema level, so there is no scenario where a
// SupplierRFQ exists independent of a PurchaseRequest; a second route accepting the same id in
// the body instead of the path would be pure duplication with no distinct meaning.
@Controller('api/v1/admin/supplier-rfqs')
@UseGuards(JwtAuthGuard)
export class AdminSupplierRfqsController {
  constructor(private readonly supplierRfqsService: SupplierRfqsService) {}

  @Get()
  findAll(@Query() query: SupplierRfqQueryDto) {
    return this.supplierRfqsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierRfqsService.findOne(id);
  }

  @Post('from-purchase-request/:purchaseRequestId')
  @HttpCode(HttpStatus.CREATED)
  createFromPurchaseRequest(
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() dto: CreateSupplierRfqDto,
  ) {
    return this.supplierRfqsService.createFromPurchaseRequest(
      purchaseRequestId,
      dto,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierRfqDto) {
    return this.supplierRfqsService.update(id, dto);
  }
}
