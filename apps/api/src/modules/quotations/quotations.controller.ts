import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CreateContactDto,
  CreateQuotationRequestDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@Controller('api/v1')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('quotation-requests')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  createQuotationRequest(@Body() dto: CreateQuotationRequestDto) {
    return this.quotationsService.createQuotationRequest(dto);
  }

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  createContact(@Body() dto: CreateContactDto) {
    return this.quotationsService.createContact(dto);
  }
}
