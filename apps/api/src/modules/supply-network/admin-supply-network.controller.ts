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
import {
  CreateSupplyNetworkConnectionDto,
  UpdateSupplyNetworkConnectionDto,
} from './dto/supply-network-connection.dto';
import {
  CreateSupplyNetworkCountryDto,
  UpdateSupplyNetworkCountryDto,
} from './dto/supply-network-country.dto';
import { UpdateHomepageSupplyNetworkSectionDto } from './dto/supply-network-section.dto';
import {
  CreateSupplyNetworkItemDto,
  UpdateSupplyNetworkItemDto,
} from './dto/supply-network-item.dto';
import { SupplyNetworkService } from './supply-network.service';

/** No `RevalidationService` calls here — Our Supply Network participates in the Homepage
 * Draft/Publish snapshot (see `HomepageService.buildSnapshotPayload`), so a draft edit here
 * must never touch the public site; only `POST /admin/homepage/publish` does. */
@Controller('api/v1/admin/supply-network')
@UseGuards(JwtAuthGuard)
export class AdminSupplyNetworkController {
  constructor(private readonly supplyNetworkService: SupplyNetworkService) {}

  // NOTE: literal routes ("section", "connections", "countries") must be declared before the
  // `:id` routes below — Nest/Express match routes in declaration order, and `:id` would
  // otherwise greedily swallow a request for e.g. `/admin/supply-network/connections` as if
  // "connections" were an item id.
  @Get('section')
  findSection() {
    return this.supplyNetworkService.findSection();
  }

  @Put('section')
  updateSection(@Body() dto: UpdateHomepageSupplyNetworkSectionDto) {
    return this.supplyNetworkService.updateSection(dto);
  }

  @Get('section/translation-status')
  getSectionTranslationStatus() {
    return this.supplyNetworkService.getSectionTranslationStatus();
  }

  @Post('section/translations/generate')
  generateSectionTranslations() {
    return this.supplyNetworkService.generateSectionTranslations();
  }

  @Get('connections')
  findAllConnections() {
    return this.supplyNetworkService.findAllConnections();
  }

  @Post('connections')
  createConnection(@Body() dto: CreateSupplyNetworkConnectionDto) {
    return this.supplyNetworkService.createConnection(dto);
  }

  @Put('connections/:id')
  updateConnection(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyNetworkConnectionDto,
  ) {
    return this.supplyNetworkService.updateConnection(id, dto);
  }

  @Delete('connections/:id')
  removeConnection(@Param('id') id: string) {
    return this.supplyNetworkService.removeConnection(id);
  }

  @Get('countries')
  findAllCountries() {
    return this.supplyNetworkService.findAllCountries();
  }

  @Post('countries')
  createCountry(@Body() dto: CreateSupplyNetworkCountryDto) {
    return this.supplyNetworkService.createCountry(dto);
  }

  @Put('countries/:id')
  updateCountry(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyNetworkCountryDto,
  ) {
    return this.supplyNetworkService.updateCountry(id, dto);
  }

  @Get('countries/:id/translation-status')
  getCountryTranslationStatus(@Param('id') id: string) {
    return this.supplyNetworkService.getCountryTranslationStatus(id);
  }

  @Post('countries/:id/translations/generate')
  generateCountryTranslations(@Param('id') id: string) {
    return this.supplyNetworkService.generateCountryTranslations(id);
  }

  @Delete('countries/:id')
  removeCountry(@Param('id') id: string) {
    return this.supplyNetworkService.removeCountry(id);
  }

  @Get()
  findAll() {
    return this.supplyNetworkService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSupplyNetworkItemDto) {
    return this.supplyNetworkService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplyNetworkItemDto) {
    return this.supplyNetworkService.update(id, dto);
  }

  @Get(':id/translation-status')
  getTranslationStatus(@Param('id') id: string) {
    return this.supplyNetworkService.getTranslationStatus(id);
  }

  @Post(':id/translations/generate')
  generateTranslations(@Param('id') id: string) {
    return this.supplyNetworkService.generateTranslations(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplyNetworkService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.supplyNetworkService.duplicate(id);
  }
}
