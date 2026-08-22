import { Module } from '@nestjs/common';
import { AdminSupplyNetworkController } from './admin-supply-network.controller';
import { SupplyNetworkService } from './supply-network.service';

/** No public controller — like Production Process, this content is snapshot-gated (see
 * `HomepageService.buildSnapshotPayload`); the public site reads it exclusively via
 * `GET /homepage/published-snapshot`, not a live per-entity endpoint here. */
@Module({
  controllers: [AdminSupplyNetworkController],
  providers: [SupplyNetworkService],
  exports: [SupplyNetworkService],
})
export class SupplyNetworkModule {}
