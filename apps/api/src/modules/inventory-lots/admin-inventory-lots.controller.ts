import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateInventoryLotDto } from './dto/create-inventory-lot.dto';
import { InventoryLotQueryDto } from './dto/inventory-lot-query.dto';
import { InventoryLotsService } from './inventory-lots.service';

// No `RolesGuard`/`@Roles`, no DELETE, no generic PATCH-status-to-anything endpoint (locked
// decision 30) — only the explicit actions this phase actually needs.
@Controller('api/v1/admin/inventory-lots')
@UseGuards(JwtAuthGuard)
export class AdminInventoryLotsController {
  constructor(private readonly inventoryLotsService: InventoryLotsService) {}

  @Get()
  findAll(@Query() query: InventoryLotQueryDto) {
    return this.inventoryLotsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryLotsService.findOne(id);
  }

  @Post('from-receiving-item/:receivingItemId')
  @HttpCode(HttpStatus.CREATED)
  createFromReceivingItem(
    @Param('receivingItemId') receivingItemId: string,
    @Body() dto: CreateInventoryLotDto,
  ) {
    return this.inventoryLotsService.createFromReceivingItem(
      receivingItemId,
      dto,
    );
  }

  @Post(':id/release')
  release(@Param('id') id: string) {
    return this.inventoryLotsService.release(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.inventoryLotsService.reject(id);
  }
}
