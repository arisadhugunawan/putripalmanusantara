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
import { AiQuickQuestionsService } from './ai-quick-questions.service';
import {
  CreateAiQuickQuestionDto,
  ReorderAiQuickQuestionsDto,
  UpdateAiQuickQuestionDto,
} from './dto/ai-quick-question.dto';

@Controller('api/v1/admin/ai/quick-questions')
@UseGuards(JwtAuthGuard)
export class AdminAiQuickQuestionsController {
  constructor(
    private readonly quickQuestionsService: AiQuickQuestionsService,
  ) {}

  @Get()
  findAll() {
    return this.quickQuestionsService.findAllForAdmin();
  }

  @Post()
  create(@Body() dto: CreateAiQuickQuestionDto) {
    return this.quickQuestionsService.create(dto);
  }

  @Put('reorder')
  reorder(@Body() dto: ReorderAiQuickQuestionsDto) {
    return this.quickQuestionsService.reorder(dto.ordered_ids);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAiQuickQuestionDto) {
    return this.quickQuestionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quickQuestionsService.remove(id);
  }
}
