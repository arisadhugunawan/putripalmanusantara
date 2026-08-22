import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/branding.dto';

const SLOTS = [
  'header',
  'footer',
  'mobile',
  'favicon',
  'product_header_background',
] as const;
type Slot = (typeof SLOTS)[number];

@Controller('api/v1/admin/branding')
@UseGuards(JwtAuthGuard)
export class AdminBrandingController {
  constructor(
    private readonly brandingService: BrandingService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findForAdmin() {
    return this.brandingService.findForAdmin();
  }

  // Header/Footer live in the shared [locale]/layout.tsx, which wraps every public route —
  // 'layout' revalidation invalidates all of them, not just "/" (RULE: Upload/Preview never
  // touch the public site; only this Save call does, and only after the DB write succeeds).
  @Put()
  async update(@Body() dto: UpdateBrandingDto) {
    const branding = await this.brandingService.update(dto);
    await this.revalidation.revalidate(['/'], 'layout');
    return branding;
  }

  @Put('reset/:slot')
  async reset(@Param('slot') slot: string) {
    if (!SLOTS.includes(slot as Slot)) {
      throw new ApiException(
        'VALIDATION_ERROR',
        `Unknown branding slot "${slot}".`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const branding = await this.brandingService.resetSlot(slot as Slot);
    await this.revalidation.revalidate(['/'], 'layout');
    return branding;
  }
}
