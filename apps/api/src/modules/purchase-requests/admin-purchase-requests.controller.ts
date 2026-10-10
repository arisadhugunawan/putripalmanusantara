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
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { PurchaseRequestQueryDto } from './dto/purchase-request-query.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestsService } from './purchase-requests.service';

// No `RolesGuard`/`@Roles` — Procurement CRUD stays open to editor and super_admin equally,
// matching every CRM/Sales controller's exact precedent. No DELETE — lifecycle states
// (`cancelled`/`rejected`) are the only removal mechanism. Conversion into a SupplierRFQ is
// implemented on `AdminSupplierRfqsController` (`from-purchase-request/:purchaseRequestId`),
// not here — see that controller's own comment for why.
@Controller('api/v1/admin/purchase-requests')
@UseGuards(JwtAuthGuard)
export class AdminPurchaseRequestsController {
  constructor(
    private readonly purchaseRequestsService: PurchaseRequestsService,
  ) {}

  @Get()
  findAll(@Query() query: PurchaseRequestQueryDto) {
    return this.purchaseRequestsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseRequestsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePurchaseRequestDto) {
    return this.purchaseRequestsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseRequestDto) {
    return this.purchaseRequestsService.update(id, dto);
  }
}
