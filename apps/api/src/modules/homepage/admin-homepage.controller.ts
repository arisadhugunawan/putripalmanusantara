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
  CreateDecorativeGraphicDto,
  UpdateDecorativeGraphicDto,
} from './dto/decorative-graphic.dto';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';
import {
  CreatePartnerLogoDto,
  UpdatePartnerLogoDto,
} from './dto/partner-logo.dto';
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

  // ── Hero Slides ─────────────────────────────────────────────────────

  @Get('hero-slides')
  findHeroSlides() {
    return this.homepageService.findHeroSlides();
  }

  @Get('hero-slides/:id')
  findHeroSlide(@Param('id') id: string) {
    return this.homepageService.findHeroSlide(id);
  }

  @Post('hero-slides')
  async createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    const slide = await this.homepageService.createHeroSlide(dto);
    await this.revalidation.revalidate(['/']);
    return slide;
  }

  @Put('hero-slides/:id')
  async updateHeroSlide(
    @Param('id') id: string,
    @Body() dto: UpdateHeroSlideDto,
  ) {
    const slide = await this.homepageService.updateHeroSlide(id, dto);
    await this.revalidation.revalidate(['/']);
    return slide;
  }

  @Delete('hero-slides/:id')
  async removeHeroSlide(@Param('id') id: string) {
    const result = await this.homepageService.removeHeroSlide(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }

  // ── Partner Logos ───────────────────────────────────────────────────

  @Get('partner-logos')
  findPartnerLogos() {
    return this.homepageService.findPartnerLogos();
  }

  @Post('partner-logos')
  async createPartnerLogo(@Body() dto: CreatePartnerLogoDto) {
    const logo = await this.homepageService.createPartnerLogo(dto);
    await this.revalidation.revalidate(['/']);
    return logo;
  }

  @Put('partner-logos/:id')
  async updatePartnerLogo(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerLogoDto,
  ) {
    const logo = await this.homepageService.updatePartnerLogo(id, dto);
    await this.revalidation.revalidate(['/']);
    return logo;
  }

  @Delete('partner-logos/:id')
  async removePartnerLogo(@Param('id') id: string) {
    const result = await this.homepageService.removePartnerLogo(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }

  // ── Decorative Graphics ─────────────────────────────────────────────

  @Get('decorative-graphics')
  findDecorativeGraphics() {
    return this.homepageService.findDecorativeGraphics();
  }

  @Post('decorative-graphics')
  async createDecorativeGraphic(@Body() dto: CreateDecorativeGraphicDto) {
    const graphic = await this.homepageService.createDecorativeGraphic(dto);
    await this.revalidation.revalidate(['/']);
    return graphic;
  }

  @Put('decorative-graphics/:id')
  async updateDecorativeGraphic(
    @Param('id') id: string,
    @Body() dto: UpdateDecorativeGraphicDto,
  ) {
    const graphic = await this.homepageService.updateDecorativeGraphic(id, dto);
    await this.revalidation.revalidate(['/']);
    return graphic;
  }

  @Delete('decorative-graphics/:id')
  async removeDecorativeGraphic(@Param('id') id: string) {
    const result = await this.homepageService.removeDecorativeGraphic(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }
}
