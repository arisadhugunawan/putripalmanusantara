import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { UpdateFooterSettingsDto } from './dto/footer.dto';
import { FooterService } from './footer.service';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

@Controller('api/v1/admin/footer')
@UseGuards(JwtAuthGuard)
export class AdminFooterController {
  constructor(
    private readonly footerService: FooterService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  find() {
    return this.footerService.find();
  }

  // The Footer renders on every public page via [locale]/layout.tsx — 'layout' revalidation
  // invalidates all of them, matching how Branding's header/footer logo save already works.
  @Put()
  async update(@Body() dto: UpdateFooterSettingsDto) {
    const result = await this.footerService.update(dto);
    await this.revalidation.revalidate(['/'], 'layout');
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
    const media = await this.footerService.uploadBackground(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      altText?.trim() || 'Footer background',
    );
    return toMedia(media);
  }
}
