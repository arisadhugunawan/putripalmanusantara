import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { FaqsService } from './faqs.service';

@Controller('api/v1/admin/faqs')
@UseGuards(JwtAuthGuard)
export class AdminFaqsController {
  constructor(
    private readonly faqsService: FaqsService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.faqsService.findAllForAdmin();
  }

  @Post()
  async create(@Body() dto: CreateFaqDto) {
    const faq = await this.faqsService.create(dto);
    await this.revalidation.revalidate(['/']);
    return faq;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    const faq = await this.faqsService.update(id, dto);
    await this.revalidation.revalidate(['/']);
    return faq;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.faqsService.remove(id);
    await this.revalidation.revalidate(['/']);
    return result;
  }
}
