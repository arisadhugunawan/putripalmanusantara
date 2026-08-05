import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { ProductionStepsService } from './production-steps.service';

@Controller('api/v1/production-steps')
export class ProductionStepsController {
  constructor(
    private readonly productionStepsService: ProductionStepsService,
  ) {}

  @Get()
  findAll(@Query('locale') locale?: string) {
    return this.productionStepsService.findAll(resolveLocale(locale));
  }
}
