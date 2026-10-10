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
import { CreateQcInspectionDto } from './dto/create-qc-inspection.dto';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { QcInspectionQueryDto } from './dto/qc-inspection-query.dto';
import { UpdateQcInspectionDto } from './dto/update-qc-inspection.dto';
import { QcService } from './qc.service';

// No `RolesGuard`/`@Roles`, no DELETE. QCInspection only ever targets an InventoryLot (locked
// decision 15) — no standalone creation.
@Controller('api/v1/admin/qc-inspections')
@UseGuards(JwtAuthGuard)
export class AdminQcController {
  constructor(private readonly qcService: QcService) {}

  @Get()
  findAll(@Query() query: QcInspectionQueryDto) {
    return this.qcService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcService.findOne(id);
  }

  @Post('from-inventory-lot/:inventoryLotId')
  @HttpCode(HttpStatus.CREATED)
  createFromInventoryLot(
    @Param('inventoryLotId') inventoryLotId: string,
    @Body() dto: CreateQcInspectionDto,
  ) {
    return this.qcService.createFromInventoryLot(inventoryLotId, dto);
  }

  @Post(':inspectionId/results')
  @HttpCode(HttpStatus.CREATED)
  createResult(
    @Param('inspectionId') inspectionId: string,
    @Body() dto: CreateQcResultDto,
  ) {
    return this.qcService.createResult(inspectionId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQcInspectionDto) {
    return this.qcService.update(id, dto);
  }
}
