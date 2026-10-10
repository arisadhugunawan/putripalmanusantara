import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { OpportunityQueryDto } from './dto/opportunity-query.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

// No `RolesGuard`/`@Roles` — CRM CRUD stays open to editor and super_admin equally, matching
// AdminLeadsController's/AdminInquiriesController's exact precedent. No standalone POST and no
// DELETE — every Opportunity requires a Lead (leadId is a required FK) and closure happens via
// `stage: 'lost'`, never a hard delete.
@Controller('api/v1/admin/opportunities')
@UseGuards(JwtAuthGuard)
export class AdminOpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@Query() query: OpportunityQueryDto) {
    return this.opportunitiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Post('from-lead/:leadId')
  @HttpCode(HttpStatus.CREATED)
  createFromLead(
    @Param('leadId') leadId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.createFromLead(leadId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunitiesService.update(id, dto);
  }
}
