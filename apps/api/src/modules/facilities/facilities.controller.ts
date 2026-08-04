import { Controller, Get } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';

@Controller('api/v1/facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  findAll() {
    return this.facilitiesService.findAll();
  }
}
