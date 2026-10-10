import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
import { InventoryMovementsService } from './inventory-movements.service';

// Read-only — append-only ledger (locked decision 30/34). No POST/PATCH/DELETE route exists;
// movements are created only as a side effect of `POST /api/v1/admin/inventory/from-lot/:id`.
@Controller('api/v1/admin/inventory-movements')
@UseGuards(JwtAuthGuard)
export class AdminInventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Get()
  findAll(@Query() query: InventoryMovementQueryDto) {
    return this.inventoryMovementsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryMovementsService.findOne(id);
  }
}
