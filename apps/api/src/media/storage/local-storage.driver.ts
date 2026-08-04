import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  StorageDriver,
  UploadedFileInput,
} from './storage-driver.interface';

/** Development storage driver — writes to apps/api/uploads/, served statically by main.ts. */
@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads');

  constructor(private readonly config: ConfigService) {}

  async upload(file: UploadedFileInput): Promise<{ url: string }> {
    await mkdir(this.uploadsDir, { recursive: true });
    const fileName = `${randomUUID()}${extname(file.originalName)}`;
    await writeFile(join(this.uploadsDir, fileName), file.buffer);

    const publicUrl = this.config.get<string>(
      'MEDIA_LOCAL_PUBLIC_URL',
      'http://localhost:4000/uploads',
    );
    return { url: `${publicUrl}/${fileName}` };
  }

  async delete(url: string): Promise<void> {
    const fileName = url.split('/').pop();
    if (!fileName) return;
    try {
      await unlink(join(this.uploadsDir, fileName));
    } catch (error) {
      this.logger.warn(
        `Could not delete local file "${fileName}": ${(error as Error).message}`,
      );
    }
  }
}
