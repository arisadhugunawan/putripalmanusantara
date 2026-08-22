import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogQueryDto } from './dto/activity-log-query.dto';

// Restricted to super_admin per the brief's own permission table ("SUPER_ADMIN: activity
// logs") — an editor's own day-to-day actions are still recorded, they just can't browse the
// full admin-wide trail, matching how Publish/Restore/AI Settings are already scoped.
@Controller('api/v1/admin/activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  @Get()
  list(@Query() query: ActivityLogQueryDto) {
    return this.activityLog.list(query);
  }

  @Get('filters')
  filterOptions() {
    return this.activityLog.filterOptions();
  }
}
