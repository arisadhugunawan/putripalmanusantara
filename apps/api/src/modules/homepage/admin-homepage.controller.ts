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
import { UpdateAboutPreviewDto } from './dto/about-preview.dto';
import {
  CreateDecorativeGraphicDto,
  UpdateDecorativeGraphicDto,
} from './dto/decorative-graphic.dto';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { CreateHighlightDto, UpdateHighlightDto } from './dto/highlight.dto';
import { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';
import {
  CreatePartnerLogoDto,
  UpdatePartnerLogoDto,
} from './dto/partner-logo.dto';
import { UpdatePartnersSectionDto } from './dto/partners-section.dto';
import {
  CreateWhyChooseUsDto,
  UpdateWhyChooseUsDto,
} from './dto/why-choose-us.dto';
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

  @Post('hero-slides/:id/duplicate')
  async duplicateHeroSlide(@Param('id') id: string) {
    const slide = await this.homepageService.duplicateHeroSlide(id);
    await this.revalidation.revalidate(['/']);
    return slide;
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

  // ── About Preview ───────────────────────────────────────────────────

  @Get('about-preview')
  findAboutPreview() {
    return this.homepageService.findAboutPreview();
  }

  @Put('about-preview')
  async updateAboutPreview(@Body() dto: UpdateAboutPreviewDto) {
    const preview = await this.homepageService.updateAboutPreview(dto);
    await this.revalidation.revalidate(['/']);
    return preview;
  }

  // ── Highlights ──────────────────────────────────────────────────────

  @Get('highlights')
  findHighlights() {
    return this.homepageService.findHighlights();
  }

  @Post('highlights')
  async createHighlight(@Body() dto: CreateHighlightDto) {
    const highlight = await this.homepageService.createHighlight(dto);
    await this.revalidation.revalidate(['/']);
    return highlight;
  }

  @Put('highlights/:id')
  async updateHighlight(
    @Param('id') id: string,
    @Body() dto: UpdateHighlightDto,
  ) {
    const highlight = await this.homepageService.updateHighlight(id, dto);
    await this.revalidation.revalidate(['/']);
    return highlight;
  }

  @Delete('highlights/:id')
  async removeHighlight(@Param('id') id: string) {
    const result = await this.homepageService.removeHighlight(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }

  // ── Partners Section ────────────────────────────────────────────────

  @Get('partners-section')
  findPartnersSection() {
    return this.homepageService.findPartnersSection();
  }

  @Put('partners-section')
  async updatePartnersSection(@Body() dto: UpdatePartnersSectionDto) {
    const section = await this.homepageService.updatePartnersSection(dto);
    await this.revalidation.revalidate(['/']);
    return section;
  }

  // ── Why Choose Us ───────────────────────────────────────────────────

  @Get('why-choose-us')
  findWhyChooseUs() {
    return this.homepageService.findWhyChooseUs();
  }

  @Post('why-choose-us')
  async createWhyChooseUs(@Body() dto: CreateWhyChooseUsDto) {
    const item = await this.homepageService.createWhyChooseUs(dto);
    await this.revalidation.revalidate(['/']);
    return item;
  }

  @Put('why-choose-us/:id')
  async updateWhyChooseUs(
    @Param('id') id: string,
    @Body() dto: UpdateWhyChooseUsDto,
  ) {
    const item = await this.homepageService.updateWhyChooseUs(id, dto);
    await this.revalidation.revalidate(['/']);
    return item;
  }

  @Delete('why-choose-us/:id')
  async removeWhyChooseUs(@Param('id') id: string) {
    const result = await this.homepageService.removeWhyChooseUs(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }
}
