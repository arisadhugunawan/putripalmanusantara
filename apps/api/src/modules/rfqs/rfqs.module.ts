import { Module } from '@nestjs/common';
import { AdminRfqsController } from './admin-rfqs.controller';
import { RfqsService } from './rfqs.service';

@Module({
  controllers: [AdminRfqsController],
  providers: [RfqsService],
})
export class RfqsModule {}
