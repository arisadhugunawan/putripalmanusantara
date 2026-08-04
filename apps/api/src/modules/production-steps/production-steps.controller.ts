import { Controller, Get } from '@nestjs/common';
import { ProductionStepsService } from './production-steps.service';

@Controller('api/v1/production-steps')
export class ProductionStepsController {
  constructor(
    private readonly productionStepsService: ProductionStepsService,
  ) {}

  @Get()
  findAll() {
    return this.productionStepsService.findAll();
  }
}
