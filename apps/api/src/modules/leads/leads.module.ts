import { Module } from '@nestjs/common';
import { AdminLeadsController } from './admin-leads.controller';
import { LeadsService } from './leads.service';

@Module({
  controllers: [AdminLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
