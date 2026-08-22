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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { ContactPageService } from './contact-page.service';
import {
  CreateContactLocationDto,
  UpdateContactLocationDto,
  UpdateContactPageSettingsDto,
} from './dto/contact-page.dto';
import {
  CreateContactSocialLinkDto,
  UpdateContactSocialLinkDto,
} from './dto/contact-social-link.dto';

@Controller('api/v1/admin/contact-page')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminContactPageController {
  constructor(
    private readonly contactPageService: ContactPageService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get('settings')
  findSettings() {
    return this.contactPageService.findSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateContactPageSettingsDto) {
    return this.contactPageService.updateSettings(dto);
  }

  @Get('locations')
  findLocations() {
    return this.contactPageService.findLocations();
  }

  @Post('locations')
  createLocation(@Body() dto: CreateContactLocationDto) {
    return this.contactPageService.createLocation(dto);
  }

  @Put('locations/:id')
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateContactLocationDto,
  ) {
    return this.contactPageService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  removeLocation(@Param('id') id: string) {
    return this.contactPageService.removeLocation(id);
  }

  @Get('social-links')
  findSocialLinks() {
    return this.contactPageService.findSocialLinks();
  }

  @Post('social-links')
  createSocialLink(@Body() dto: CreateContactSocialLinkDto) {
    return this.contactPageService.createSocialLink(dto);
  }

  @Put('social-links/:id')
  updateSocialLink(
    @Param('id') id: string,
    @Body() dto: UpdateContactSocialLinkDto,
  ) {
    return this.contactPageService.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  removeSocialLink(@Param('id') id: string) {
    return this.contactPageService.removeSocialLink(id);
  }

  @Get('publish-status')
  getPublishStatus() {
    return this.contactPageService.getPublishStatus();
  }

  @Post('publish')
  @Roles('super_admin')
  async publish() {
    const result = await this.contactPageService.publish();
    await this.revalidation.revalidate(['/contact']);
    return result;
  }

  @Post('unpublish')
  @Roles('super_admin')
  async unpublish() {
    const result = await this.contactPageService.unpublish();
    await this.revalidation.revalidate(['/contact']);
    return result;
  }
}
