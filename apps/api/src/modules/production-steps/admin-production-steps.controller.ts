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
import { UpdateHomepageProcessSectionDto } from './dto/production-section.dto';
import {
  CreateProductionStepDto,
  UpdateProductionStepDto,
} from './dto/production-step.dto';
import { ProductionStepsService } from './production-steps.service';

/** No `RevalidationService` calls here — Production Process now participates in the Homepage
 * Draft/Publish snapshot (see `HomepageService.buildSnapshotPayload`), so a draft edit here
 * must never touch the public site; only `POST /admin/homepage/publish` does. */
@Controller('api/v1/admin/production-steps')
@UseGuards(JwtAuthGuard)
export class AdminProductionStepsController {
  constructor(
    private readonly productionStepsService: ProductionStepsService,
  ) {}

  // NOTE: the literal "section" routes must be declared before the `:id` routes below —
  // Nest/Express match routes in declaration order, and `:id` would otherwise greedily
  // swallow a request for `/admin/production-steps/section` as if "section" were an id.
  @Get('section')
  findSection() {
    return this.productionStepsService.findSection();
  }

  @Put('section')
  updateSection(@Body() dto: UpdateHomepageProcessSectionDto) {
    return this.productionStepsService.updateSection(dto);
  }

  @Get()
  findAll() {
    return this.productionStepsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateProductionStepDto) {
    return this.productionStepsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductionStepDto) {
    return this.productionStepsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionStepsService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.productionStepsService.duplicate(id);
  }
}
