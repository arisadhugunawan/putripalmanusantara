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
  AddFacilityGalleryItemDto,
  CreateFacilityDto,
  UpdateFacilityDto,
} from './dto/facility.dto';
import { FacilitiesService } from './facilities.service';

@Controller('api/v1/admin/facilities')
@UseGuards(JwtAuthGuard)
export class AdminFacilitiesController {
  constructor(
    private readonly facilitiesService: FacilitiesService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.facilitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateFacilityDto) {
    const facility = await this.facilitiesService.create(dto);
    await this.revalidation.revalidate(['/facilities', '/']);
    return facility;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    const facility = await this.facilitiesService.update(id, dto);
    await this.revalidation.revalidate(['/facilities', '/']);
    return facility;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.facilitiesService.remove(id);
    await this.revalidation.revalidate(['/facilities', '/']);
    return result;
  }

  @Post(':id/gallery')
  addGalleryItem(
    @Param('id') id: string,
    @Body() dto: AddFacilityGalleryItemDto,
  ) {
    return this.facilitiesService.addGalleryItem(id, dto);
  }

  @Delete(':id/gallery/:galleryId')
  removeGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
  ) {
    return this.facilitiesService.removeGalleryItem(id, galleryId);
  }
}
