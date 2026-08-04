import { Controller, Get } from '@nestjs/common';
import { HomepageService } from './homepage.service';

@Controller('api/v1/homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('statistics')
  findStatistics() {
    return this.homepageService.findStatistics();
  }
}
