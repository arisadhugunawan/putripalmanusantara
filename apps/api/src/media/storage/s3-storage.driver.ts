import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  StorageDriver,
  UploadedFileInput,
} from './storage-driver.interface';

/**
 * Production storage driver for S3-compatible object storage (Cloudflare R2 / AWS S3),
 * per docs/06-architecture.md §2. Activated via MEDIA_STORAGE_DRIVER=s3; requires the
 * S3_* environment variables to be set.
 *
 * Initialization is lazy: this provider is always constructed (the local driver is the
 * default), so reading S3_* env vars must not happen — and must not throw — until a
 * request actually needs it.
 */
@Injectable()
export class S3StorageDriver implements StorageDriver {
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';

  constructor(private readonly config: ConfigService) {}

  private ensureClient(): S3Client {
    if (this.client) return this.client;

    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
    this.publicUrl = this.config.getOrThrow<string>('S3_PUBLIC_URL');
    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION', 'auto'),
      endpoint: this.config.getOrThrow<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
    return this.client;
  }

  async upload(file: UploadedFileInput): Promise<{ url: string }> {
    const client = this.ensureClient();
    const key = `${randomUUID()}${extname(file.originalName)}`;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
      }),
    );
    return { url: `${this.publicUrl}/${key}` };
  }

  async delete(url: string): Promise<void> {
    const client = this.ensureClient();
    const key = url.split('/').pop();
    if (!key) return;
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
