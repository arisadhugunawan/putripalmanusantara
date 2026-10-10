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
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RfqQueryDto } from './dto/rfq-query.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { RfqsService } from './rfqs.service';

// No `RolesGuard`/`@Roles` — CRM CRUD stays open to editor and super_admin equally, matching
// AdminOpportunitiesController's/AdminLeadsController's exact precedent. No DELETE and no
// item-level routes — RFQ items are fixed at creation time for v1.
@Controller('api/v1/admin/rfqs')
@UseGuards(JwtAuthGuard)
export class AdminRfqsController {
  constructor(private readonly rfqsService: RfqsService) {}

  @Get()
  findAll(@Query() query: RfqQueryDto) {
    return this.rfqsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createStandalone(@Body() dto: CreateRfqDto) {
    return this.rfqsService.createStandalone(dto);
  }

  @Post('from-opportunity/:opportunityId')
  @HttpCode(HttpStatus.CREATED)
  createFromOpportunity(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: CreateRfqDto,
  ) {
    return this.rfqsService.createFromOpportunity(opportunityId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRfqDto) {
    return this.rfqsService.update(id, dto);
  }
}
