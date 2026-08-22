import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogInterceptor } from './activity-log.interceptor';
import { ActivityLogService } from './activity-log.service';
import { AdminActivityLogController } from './admin-activity-log.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminActivityLogController],
  providers: [ActivityLogService, ActivityLogInterceptor],
  exports: [ActivityLogService, ActivityLogInterceptor],
})
export class ActivityLogModule {}
