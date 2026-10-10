import { Module } from '@nestjs/common';
import { AdminInquiriesController } from './admin-inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  controllers: [AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
