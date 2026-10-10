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
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryService } from './inventory.service';

// No `RolesGuard`/`@Roles`, no DELETE, no generic status-update endpoint (locked decision 30)
// — Inventory is only ever created from an InventoryLot placement.
@Controller('api/v1/admin/inventory')
@UseGuards(JwtAuthGuard)
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('from-lot/:inventoryLotId')
  @HttpCode(HttpStatus.CREATED)
  createFromLot(
    @Param('inventoryLotId') inventoryLotId: string,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.createFromLot(inventoryLotId, dto);
  }
}
