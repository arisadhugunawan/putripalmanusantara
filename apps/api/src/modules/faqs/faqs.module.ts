import { Module } from '@nestjs/common';
import { AdminFaqsController } from './admin-faqs.controller';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  controllers: [FaqsController, AdminFaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
