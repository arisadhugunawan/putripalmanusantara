import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RevalidationService } from '../revalidation/revalidation.service';
import { MediaQueryDto } from './dto/media-query.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { toMedia } from './media.mapper';
import { MediaService } from './media.service';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — covers product spec sheets & short clips

@Controller('api/v1/admin/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadMediaDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    const media = await this.mediaService.upload(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      body.alt_text,
      body.context,
    );
    await this.revalidation.revalidate(['/gallery']);
    return toMedia(media);
  }

  @Get(':id/usage')
  getUsage(@Param('id') id: string) {
    return this.mediaService.getUsage(id);
  }

  // "Delete" from the main Media Library is now "move to Trash" — recoverable, never
  // silently destructive. Permanent removal is the separate route below.
  @Delete(':id')
  async trash(@Param('id') id: string) {
    return this.mediaService.trash(id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.mediaService.restore(id);
  }

  @Delete(':id/permanent')
  async permanentDelete(@Param('id') id: string) {
    return this.mediaService.permanentDelete(id);
  }
}
