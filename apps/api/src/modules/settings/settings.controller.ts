import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  findPublic() {
    return this.settingsService.findPublic();
  }
}
