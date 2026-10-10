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
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiriesService } from './inquiries.service';

// No `RolesGuard`/`@Roles` — CRM CRUD is day-to-day operational work, open to editor and
// super_admin alike, matching AdminQuotationsController's own precedent exactly.
@Controller('api/v1/admin/inquiries')
@UseGuards(JwtAuthGuard)
export class AdminInquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  findAll(@Query() query: InquiryQueryDto) {
    return this.inquiriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.create(dto);
  }

  @Post('from-quotation-request/:quotationRequestId')
  @HttpCode(HttpStatus.CREATED)
  convertFromQuotationRequest(
    @Param('quotationRequestId') quotationRequestId: string,
  ) {
    return this.inquiriesService.convertFromQuotationRequest(
      quotationRequestId,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInquiryDto) {
    return this.inquiriesService.update(id, dto);
  }
}
