import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicSiteBranding, toSiteBranding } from './branding.mapper';
import type { UpdateBrandingDto } from './dto/branding.dto';

const BRANDING_INCLUDE = {
  headerLogo: true,
  footerLogo: true,
  mobileLogo: true,
  favicon: true,
  productHeaderBackground: true,
} as const;

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreate() {
    const existing = await this.prisma.siteBranding.findFirst({
      include: BRANDING_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.siteBranding.create({
      data: {},
      include: BRANDING_INCLUDE,
    });
  }

  async findPublic() {
    const entry = await this.getOrCreate();
    return toPublicSiteBranding(entry);
  }

  async findForAdmin() {
    const entry = await this.getOrCreate();
    return toSiteBranding(entry);
  }

  async update(dto: UpdateBrandingDto) {
    const existing = await this.getOrCreate();
    const updated = await this.prisma.siteBranding.update({
      where: { id: existing.id },
      data: {
        headerLogoId: dto.header_logo_id,
        headerLogoEnabled: dto.header_logo_enabled,
        headerLogoAlt: dto.header_logo_alt,
        footerLogoId: dto.footer_logo_id,
        footerLogoEnabled: dto.footer_logo_enabled,
        footerLogoAlt: dto.footer_logo_alt,
        mobileLogoId: dto.mobile_logo_id,
        useMobileLogo: dto.use_mobile_logo,
        mobileLogoAlt: dto.mobile_logo_alt,
        faviconId: dto.favicon_id,
        productHeaderBackgroundId: dto.product_header_background_id,
      },
      include: BRANDING_INCLUDE,
    });
    return toSiteBranding(updated);
  }

  /** "Gunakan Logo Default" — clears one slot back to unset (falls back to the text
   * wordmark/no favicon), same effect as saving with that slot's id set to null. */
  async resetSlot(
    slot:
      'header' | 'footer' | 'mobile' | 'favicon' | 'product_header_background',
  ) {
    const existing = await this.getOrCreate();
    const data =
      slot === 'header'
        ? { headerLogoId: null, headerLogoAlt: null }
        : slot === 'footer'
          ? { footerLogoId: null, footerLogoAlt: null }
          : slot === 'mobile'
            ? { mobileLogoId: null, useMobileLogo: false, mobileLogoAlt: null }
            : slot === 'favicon'
              ? { faviconId: null }
              : { productHeaderBackgroundId: null };
    const updated = await this.prisma.siteBranding.update({
      where: { id: existing.id },
      data,
      include: BRANDING_INCLUDE,
    });
    return toSiteBranding(updated);
  }
}
