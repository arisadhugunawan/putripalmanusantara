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
import { CreateReceivingDto } from './dto/create-receiving.dto';
import { CreateWeighbridgeTransactionDto } from './dto/create-weighbridge-transaction.dto';
import { ReceivingQueryDto } from './dto/receiving-query.dto';
import { UpdateReceivingDto } from './dto/update-receiving.dto';
import { ReceivingsService } from './receivings.service';

// No `RolesGuard`/`@Roles`, no DELETE, no standalone POST — a Receiving only ever exists as a
// conversion of an eligible PurchaseOrder (locked decision 8); `Receiving.purchaseOrderId` is
// required at the schema level, so a PO-less Receiving isn't possible.
@Controller('api/v1/admin/receivings')
@UseGuards(JwtAuthGuard)
export class AdminReceivingsController {
  constructor(private readonly receivingsService: ReceivingsService) {}

  @Get()
  findAll(@Query() query: ReceivingQueryDto) {
    return this.receivingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receivingsService.findOne(id);
  }

  @Post('from-purchase-order/:purchaseOrderId')
  @HttpCode(HttpStatus.CREATED)
  createFromPurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() dto: CreateReceivingDto,
  ) {
    return this.receivingsService.createFromPurchaseOrder(purchaseOrderId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReceivingDto) {
    return this.receivingsService.update(id, dto);
  }

  // Weighbridge is entirely optional (locked decision 11) — this one creation endpoint is the
  // only Weighbridge route exposed in v1, consistent with "don't build an endpoint without a
  // real use case" (locked decision 24).
  @Post(':id/weighbridge-transactions')
  @HttpCode(HttpStatus.CREATED)
  createWeighbridgeTransaction(
    @Param('id') id: string,
    @Body() dto: CreateWeighbridgeTransactionDto,
  ) {
    return this.receivingsService.createWeighbridgeTransaction(id, dto);
  }
}
