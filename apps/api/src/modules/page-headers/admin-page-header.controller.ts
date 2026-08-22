import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { toMedia } from '../../media/media.mapper';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { UpdatePageHeaderDto } from './dto/page-header.dto';
import { PageHeaderService } from './page-header.service';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** The public pages this system feeds are cached under their own paths, not one shared
 * layout (unlike Branding's header/footer) — revalidate only the specific page a given
 * `page_key` actually affects. Product Detail affects every product slug, so its own path
 * segment can't be listed individually; `/products` (its static parent) is revalidated
 * instead, matching the ISR granularity `getProductBySlug` already uses. */
const REVALIDATE_PATHS: Record<string, string[]> = {
  'about-company': ['/about'],
  products: ['/products'],
  'product-detail': ['/products'],
  facilities: ['/facilities'],
  gallery: ['/gallery'],
  news: ['/articles'],
  'global-default': [
    '/about',
    '/products',
    '/facilities',
    '/gallery',
    '/articles',
  ],
};

@Controller('api/v1/admin/page-headers')
@UseGuards(JwtAuthGuard)
export class AdminPageHeaderController {
  constructor(
    private readonly pageHeaderService: PageHeaderService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.pageHeaderService.findAllForAdmin();
  }

  @Get(':pageKey')
  findOne(@Param('pageKey') pageKey: string) {
    return this.pageHeaderService.findOneForAdmin(pageKey);
  }

  @Put(':pageKey')
  async update(
    @Param('pageKey') pageKey: string,
    @Body() dto: UpdatePageHeaderDto,
  ) {
    const result = await this.pageHeaderService.update(pageKey, dto);
    await this.revalidation.revalidate(REVALIDATE_PATHS[pageKey] ?? []);
    return result;
  }

  @Put(':pageKey/reset')
  async reset(@Param('pageKey') pageKey: string) {
    const result = await this.pageHeaderService.reset(pageKey);
    await this.revalidation.revalidate(REVALIDATE_PATHS[pageKey] ?? []);
    return result;
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('alt_text') altText: string | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    const media = await this.pageHeaderService.uploadBackground(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      altText?.trim() || 'Page header background',
    );
    return toMedia(media);
  }
}
