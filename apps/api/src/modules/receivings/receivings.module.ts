import { Module } from '@nestjs/common';
import { AdminReceivingsController } from './admin-receivings.controller';
import { ReceivingsService } from './receivings.service';

@Module({
  controllers: [AdminReceivingsController],
  providers: [ReceivingsService],
})
export class ReceivingsModule {}
