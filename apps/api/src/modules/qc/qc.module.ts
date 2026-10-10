import { Module } from '@nestjs/common';
import { AdminQcController } from './admin-qc.controller';
import { QcService } from './qc.service';

@Module({
  controllers: [AdminQcController],
  providers: [QcService],
})
export class QcModule {}
