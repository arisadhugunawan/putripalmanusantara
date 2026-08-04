import { Module } from '@nestjs/common';
import { AdminQuotationsController } from './admin-quotations.controller';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  controllers: [QuotationsController, AdminQuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
