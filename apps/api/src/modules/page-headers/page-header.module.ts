import { Module } from '@nestjs/common';
import { MediaModule } from '../../media/media.module';
import { AdminPageHeaderController } from './admin-page-header.controller';
import { PageHeaderController } from './page-header.controller';
import { PageHeaderService } from './page-header.service';

@Module({
  imports: [MediaModule],
  controllers: [PageHeaderController, AdminPageHeaderController],
  providers: [PageHeaderService],
})
export class PageHeaderModule {}
