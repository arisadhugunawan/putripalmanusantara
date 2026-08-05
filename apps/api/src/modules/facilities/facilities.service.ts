import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddFacilityGalleryItemDto,
  CreateFacilityDto,
  UpdateFacilityDto,
} from './dto/facility.dto';
import { toFacility } from './facility.mapper';

const INCLUDE = {
  coverImage: true,
  gallery: { include: { media: true } },
} as const;

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(locale?: string) {
    const facilities = await this.prisma.facility.findMany({
      include: INCLUDE,
      orderBy: { order: 'asc' },
    });
    return facilities.map((facility) => toFacility(facility, locale));
  }

  async findOne(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!facility)
      throw new ApiException('NOT_FOUND', 'Facility not found.', 404);
    return toFacility(facility);
  }

  async create(dto: CreateFacilityDto) {
    const facility = await this.prisma.facility.create({
      data: {
        name: dto.name,
        description: dto.description,
        coverImageId: dto.cover_image_id,
        order: dto.order ?? 0,
        translations: dto.translations,
      },
      include: INCLUDE,
    });
    return toFacility(facility);
  }

  async update(id: string, dto: UpdateFacilityDto) {
    await this.assertExists(id);
    const facility = await this.prisma.facility.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        coverImageId: dto.cover_image_id,
        order: dto.order,
        translations: dto.translations,
      },
      include: INCLUDE,
    });
    return toFacility(facility);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.facility.delete({ where: { id } });
    return { deleted: true };
  }

  async addGalleryItem(facilityId: string, dto: AddFacilityGalleryItemDto) {
    await this.assertExists(facilityId);
    await this.prisma.facilityGalleryImage.create({
      data: { facilityId, mediaId: dto.media_id, order: dto.order ?? 0 },
    });
    return this.findOne(facilityId);
  }

  async removeGalleryItem(facilityId: string, galleryId: string) {
    const item = await this.prisma.facilityGalleryImage.findFirst({
      where: { id: galleryId, facilityId },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
    await this.prisma.facilityGalleryImage.delete({ where: { id: galleryId } });
    return this.findOne(facilityId);
  }

  private async assertExists(id: string) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility)
      throw new ApiException('NOT_FOUND', 'Facility not found.', 404);
  }
}
