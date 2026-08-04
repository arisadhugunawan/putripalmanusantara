import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageDriver } from './storage/local-storage.driver';
import { S3StorageDriver } from './storage/s3-storage.driver';
import { STORAGE_DRIVER } from './storage/storage-driver.interface';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService, LocalStorageDriver, S3StorageDriver],
      useFactory: (
        config: ConfigService,
        local: LocalStorageDriver,
        s3: S3StorageDriver,
      ) =>
        config.get<string>('MEDIA_STORAGE_DRIVER', 'local') === 's3'
          ? s3
          : local,
    },
    LocalStorageDriver,
    S3StorageDriver,
  ],
  exports: [MediaService],
})
export class MediaModule {}
