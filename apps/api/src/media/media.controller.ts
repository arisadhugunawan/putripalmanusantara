import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RevalidationService } from '../revalidation/revalidation.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — covers product spec sheets & short clips

@Controller('api/v1/admin/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

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
    );
    await this.revalidation.revalidate(['/gallery']);
    return media;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }
}
