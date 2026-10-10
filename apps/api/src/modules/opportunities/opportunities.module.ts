import { Module } from '@nestjs/common';
import { AdminOpportunitiesController } from './admin-opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
  controllers: [AdminOpportunitiesController],
  providers: [OpportunitiesService],
})
export class OpportunitiesModule {}
