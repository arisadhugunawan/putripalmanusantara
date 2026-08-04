import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@Controller('api/v1/admin/settings')
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.settingsService.findAllForAdmin();
  }

  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    const settings = await this.settingsService.replace(dto);
    await this.revalidation.revalidate(['/']);
    return settings;
  }
}
