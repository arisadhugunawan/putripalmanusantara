import { Module } from '@nestjs/common';
import { ProductionStepsModule } from '../production-steps/production-steps.module';
import { SupplyNetworkModule } from '../supply-network/supply-network.module';
import { AdminHomepageController } from './admin-homepage.controller';
import { HomepageController } from './homepage.controller';
import { HomepageService } from './homepage.service';

@Module({
  imports: [ProductionStepsModule, SupplyNetworkModule],
  controllers: [HomepageController, AdminHomepageController],
  providers: [HomepageService],
  exports: [HomepageService],
})
export class HomepageModule {}
