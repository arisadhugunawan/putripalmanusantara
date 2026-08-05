import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { FacilitiesService } from './facilities.service';

@Controller('api/v1/facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  findAll(@Query('locale') locale?: string) {
    return this.facilitiesService.findAll(resolveLocale(locale));
  }
}
