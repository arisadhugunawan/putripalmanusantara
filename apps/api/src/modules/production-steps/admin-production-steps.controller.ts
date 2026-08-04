import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import {
  CreateProductionStepDto,
  UpdateProductionStepDto,
} from './dto/production-step.dto';
import { ProductionStepsService } from './production-steps.service';

@Controller('api/v1/admin/production-steps')
@UseGuards(JwtAuthGuard)
export class AdminProductionStepsController {
  constructor(
    private readonly productionStepsService: ProductionStepsService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.productionStepsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateProductionStepDto) {
    const step = await this.productionStepsService.create(dto);
    await this.revalidation.revalidate(['/production-process', '/']);
    return step;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductionStepDto) {
    const step = await this.productionStepsService.update(id, dto);
    await this.revalidation.revalidate(['/production-process', '/']);
    return step;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.productionStepsService.remove(id);
    await this.revalidation.revalidate(['/production-process', '/']);
    return result;
  }
}
