import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';
import { HomepageService } from './homepage.service';

@Controller('api/v1/admin/homepage')
@UseGuards(JwtAuthGuard)
export class AdminHomepageController {
  constructor(
    private readonly homepageService: HomepageService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get('statistics')
  findStatistics() {
    return this.homepageService.findStatistics();
  }

  @Put('statistics')
  async replaceStatistics(@Body() dto: ReplaceHomepageStatisticsDto) {
    const statistics = await this.homepageService.replaceStatistics(dto);
    await this.revalidation.revalidate(['/']);
    return statistics;
  }
}
