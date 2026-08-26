import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
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

  // P1-6 — `upsert()` on the `singleton` marker (always `true`, `@unique`) closes the
  // findFirst()-then-create() TOCTOU race: two concurrent calls now resolve to the SAME
  // database-enforced row instead of racing to create two.
  private async getOrCreate() {
    return this.prisma.siteBranding.upsert({
      where: { singleton: true },
      create: { singleton: true },
      update: {},
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
    await this.assertMediaIdsValid([
      dto.header_logo_id,
      dto.footer_logo_id,
      dto.mobile_logo_id,
      dto.favicon_id,
      dto.product_header_background_id,
    ]);
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

  /** Mirrors `GalleryService.assertMediaValid()` (P0.4-D2) — without this, a stale/deleted
   * media id (e.g. picked in Brand & Logo settings in one tab while permanently deleted from
   * Media Library in another) falls straight through to Prisma and throws an unhandled FK
   * violation, surfacing as a raw 500 instead of a clean 400. Batches all five slots into one
   * query rather than one lookup per field — `null` (explicitly clearing a slot) and
   * `undefined` (field not present in this update) are both left alone, only a real id is
   * checked. */
  private async assertMediaIdsValid(ids: (string | null | undefined)[]) {
    const provided = [...new Set(ids.filter((id): id is string => !!id))];
    if (provided.length === 0) return;
    const found = await this.prisma.media.findMany({
      where: { id: { in: provided } },
      select: { id: true },
    });
    if (found.length === provided.length) return;
    const foundIds = new Set(found.map((m) => m.id));
    const missing = provided.filter((id) => !foundIds.has(id));
    throw new ApiException(
      'INVALID_MEDIA',
      `Media not found: ${missing.join(', ')}`,
      400,
    );
  }
}
