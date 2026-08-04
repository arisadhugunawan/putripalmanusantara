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
import { CreateGalleryItemDto, UpdateGalleryItemDto } from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@Controller('api/v1/admin/gallery')
@UseGuards(JwtAuthGuard)
export class AdminGalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateGalleryItemDto) {
    const item = await this.galleryService.create(dto);
    await this.revalidation.revalidate(['/gallery', '/']);
    return item;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    const item = await this.galleryService.update(id, dto);
    await this.revalidation.revalidate(['/gallery']);
    return item;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.galleryService.remove(id);
    await this.revalidation.revalidate(['/gallery']);
    return result;
  }
}
