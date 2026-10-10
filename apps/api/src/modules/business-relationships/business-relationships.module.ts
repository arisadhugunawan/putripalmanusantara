import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminBusinessRelationshipsController } from './admin-business-relationships.controller';
import { AdminBusinessRelationshipsService } from './admin-business-relationships.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBusinessRelationshipsController],
  providers: [AdminBusinessRelationshipsService],
})
export class BusinessRelationshipsModule {}
