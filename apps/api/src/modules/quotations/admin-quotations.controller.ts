import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  QuotationQueryDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@Controller('api/v1/admin/quotation-requests')
@UseGuards(JwtAuthGuard)
export class AdminQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  findAll(@Query() query: QuotationQueryDto) {
    return this.quotationsService.findAllForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOneForAdmin(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuotationStatusDto) {
    return this.quotationsService.updateStatus(id, dto);
  }
}
