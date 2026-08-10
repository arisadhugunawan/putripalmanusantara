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
import {
  CreateExportDestinationDto,
  UpdateExportDestinationDto,
} from './dto/export-destination.dto';
import { UpdateExportReachSectionDto } from './dto/export-reach-section.dto';
import { CreateHeroSlideDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { CreateHighlightDto, UpdateHighlightDto } from './dto/highlight.dto';
import { UpdateHomepageSectionDto } from './dto/homepage-section.dto';
import { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';
import {
  CreatePartnerLogoDto,
  UpdatePartnerLogoDto,
} from './dto/partner-logo.dto';
import { UpdatePartnersSectionDto } from './dto/partners-section.dto';
import {
  CreateShippingPartnerDto,
  UpdateShippingPartnerDto,
} from './dto/shipping-partner.dto';
import { UpdateShippingSectionDto } from './dto/shipping-section.dto';
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
    return slide;
  }

  @Put('hero-slides/:id')
  async updateHeroSlide(
    @Param('id') id: string,
    @Body() dto: UpdateHeroSlideDto,
  ) {
    const slide = await this.homepageService.updateHeroSlide(id, dto);
    return slide;
  }

  @Delete('hero-slides/:id')
  async removeHeroSlide(@Param('id') id: string) {
    const result = await this.homepageService.removeHeroSlide(id);
    return result;
  }

  @Post('hero-slides/:id/duplicate')
  async duplicateHeroSlide(@Param('id') id: string) {
    const slide = await this.homepageService.duplicateHeroSlide(id);
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
    return logo;
  }

  @Put('partner-logos/:id')
  async updatePartnerLogo(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerLogoDto,
  ) {
    const logo = await this.homepageService.updatePartnerLogo(id, dto);
    return logo;
  }

  @Delete('partner-logos/:id')
  async removePartnerLogo(@Param('id') id: string) {
    const result = await this.homepageService.removePartnerLogo(id);
    return result;
  }

  @Post('partner-logos/:id/duplicate')
  async duplicatePartnerLogo(@Param('id') id: string) {
    const logo = await this.homepageService.duplicatePartnerLogo(id);
    return logo;
  }

  // ── Decorative Graphics ─────────────────────────────────────────────

  @Get('decorative-graphics')
  findDecorativeGraphics() {
    return this.homepageService.findDecorativeGraphics();
  }

  @Post('decorative-graphics')
  async createDecorativeGraphic(@Body() dto: CreateDecorativeGraphicDto) {
    const graphic = await this.homepageService.createDecorativeGraphic(dto);
    return graphic;
  }

  @Put('decorative-graphics/:id')
  async updateDecorativeGraphic(
    @Param('id') id: string,
    @Body() dto: UpdateDecorativeGraphicDto,
  ) {
    const graphic = await this.homepageService.updateDecorativeGraphic(id, dto);
    return graphic;
  }

  @Delete('decorative-graphics/:id')
  async removeDecorativeGraphic(@Param('id') id: string) {
    const result = await this.homepageService.removeDecorativeGraphic(id);
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
    return highlight;
  }

  @Put('highlights/:id')
  async updateHighlight(
    @Param('id') id: string,
    @Body() dto: UpdateHighlightDto,
  ) {
    const highlight = await this.homepageService.updateHighlight(id, dto);
    return highlight;
  }

  @Delete('highlights/:id')
  async removeHighlight(@Param('id') id: string) {
    const result = await this.homepageService.removeHighlight(id);
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
    return item;
  }

  @Put('why-choose-us/:id')
  async updateWhyChooseUs(
    @Param('id') id: string,
    @Body() dto: UpdateWhyChooseUsDto,
  ) {
    const item = await this.homepageService.updateWhyChooseUs(id, dto);
    return item;
  }

  @Delete('why-choose-us/:id')
  async removeWhyChooseUs(@Param('id') id: string) {
    const result = await this.homepageService.removeWhyChooseUs(id);
    return result;
  }

  // ── Global Export Reach ─────────────────────────────────────────────

  @Get('export-reach-section')
  findExportReachSection() {
    return this.homepageService.findExportReachSection();
  }

  @Put('export-reach-section')
  async updateExportReachSection(@Body() dto: UpdateExportReachSectionDto) {
    const section = await this.homepageService.updateExportReachSection(dto);
    return section;
  }

  @Get('export-destinations')
  findExportDestinations() {
    return this.homepageService.findExportDestinations();
  }

  @Post('export-destinations')
  async createExportDestination(@Body() dto: CreateExportDestinationDto) {
    const destination = await this.homepageService.createExportDestination(dto);
    return destination;
  }

  @Put('export-destinations/:id')
  async updateExportDestination(
    @Param('id') id: string,
    @Body() dto: UpdateExportDestinationDto,
  ) {
    const destination = await this.homepageService.updateExportDestination(
      id,
      dto,
    );
    return destination;
  }

  @Delete('export-destinations/:id')
  async removeExportDestination(@Param('id') id: string) {
    const result = await this.homepageService.removeExportDestination(id);
    return result;
  }

  // ── Shipping Partners ────────────────────────────────────────────────

  @Get('shipping-partners')
  findShippingPartners() {
    return this.homepageService.findShippingPartners();
  }

  @Post('shipping-partners')
  async createShippingPartner(@Body() dto: CreateShippingPartnerDto) {
    const partner = await this.homepageService.createShippingPartner(dto);
    return partner;
  }

  @Put('shipping-partners/:id')
  async updateShippingPartner(
    @Param('id') id: string,
    @Body() dto: UpdateShippingPartnerDto,
  ) {
    const partner = await this.homepageService.updateShippingPartner(id, dto);
    return partner;
  }

  @Delete('shipping-partners/:id')
  async removeShippingPartner(@Param('id') id: string) {
    const result = await this.homepageService.removeShippingPartner(id);
    return result;
  }

  @Post('shipping-partners/:id/duplicate')
  async duplicateShippingPartner(@Param('id') id: string) {
    const partner = await this.homepageService.duplicateShippingPartner(id);
    return partner;
  }

  @Get('shipping-section')
  findShippingSection() {
    return this.homepageService.findShippingSection();
  }

  @Put('shipping-section')
  async updateShippingSection(@Body() dto: UpdateShippingSectionDto) {
    const section = await this.homepageService.updateShippingSection(dto);
    return section;
  }

  // ── Homepage Manager: Draft/Publish ─────────────────────────────────

  @Get('sections')
  findSections() {
    return this.homepageService.getSections();
  }

  // Order/visibility changes are draft state — deliberately NOT revalidated here; they only
  // take effect on the public Homepage after an explicit Publish (see Rule 1: no auto-publish).
  @Put('sections/:key')
  updateSection(
    @Param('key') key: string,
    @Body() dto: UpdateHomepageSectionDto,
  ) {
    return this.homepageService.updateSection(key, dto);
  }

  @Get('publish-status')
  getPublishStatus() {
    return this.homepageService.getPublishStatus();
  }

  @Post('publish')
  async publish() {
    const result = await this.homepageService.publishHomepage();
    await this.revalidation.revalidate(['/']);
    return result;
  }

  @Get('snapshots')
  listSnapshots() {
    return this.homepageService.listSnapshots();
  }

  @Post('snapshots/:id/restore')
  async restoreSnapshot(@Param('id') id: string) {
    const result = await this.homepageService.restoreSnapshot(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }
}
