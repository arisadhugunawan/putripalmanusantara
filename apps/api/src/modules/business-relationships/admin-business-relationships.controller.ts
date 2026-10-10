import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  CurrentAdmin,
  type CurrentAdminPayload,
} from '../../common/decorators/current-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminBusinessRelationshipsService } from './admin-business-relationships.service';
import { AdminBusinessRelationshipQueryDto } from './dto/admin-business-relationship-query.dto';

// Reads (list/detail) stay open to any authenticated admin — only the four state-changing
// actions below carry their own `@Roles('super_admin')`, matching how Product publish/
// unpublish/restore and AI Settings are already scoped (consequential, external-facing,
// not casually reversible).
@Controller('api/v1/admin/business-relationships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminBusinessRelationshipsController {
  constructor(private readonly service: AdminBusinessRelationshipsService) {}

  @Get()
  list(@Query() query: AdminBusinessRelationshipQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @Roles('super_admin')
  approve(@Param('id') id: string, @CurrentAdmin() admin: CurrentAdminPayload) {
    return this.service.approve(admin, id);
  }

  @Post(':id/reject')
  @Roles('super_admin')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Post(':id/suspend')
  @Roles('super_admin')
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Post(':id/reactivate')
  @Roles('super_admin')
  reactivate(@Param('id') id: string) {
    return this.service.reactivate(id);
  }
}
