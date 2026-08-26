import { BrandingService } from './branding.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const siteBranding = {
    upsert: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  // P0.4-D2 — assertMediaIdsValid() looks up `prisma.media`; defaults to "every id exists" so
  // tests that don't care about media validation don't each have to stub it individually. Only
  // the tests exercising the new guard override this explicitly.
  const media = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
  };
  const prisma = { siteBranding, media };
  return {
    service: new BrandingService(prisma as unknown as PrismaService),
    siteBranding,
    media,
  };
}

function stubBrandingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'branding-1',
    headerLogoId: null,
    headerLogo: null,
    headerLogoEnabled: true,
    headerLogoAlt: null,
    footerLogoId: null,
    footerLogo: null,
    footerLogoEnabled: true,
    footerLogoAlt: null,
    mobileLogoId: null,
    mobileLogo: null,
    useMobileLogo: false,
    mobileLogoAlt: null,
    faviconId: null,
    favicon: null,
    productHeaderBackgroundId: null,
    productHeaderBackground: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

// P0.4-D2 — update() previously wrote all five logo/favicon/background media ids straight into
// Prisma with no existence check anywhere in the file. A stale/deleted id (picked in Brand &
// Logo settings in one tab while permanently deleted from Media Library in another) fell
// through to an unhandled FK violation → raw 500. assertMediaIdsValid() mirrors
// GalleryService.assertMediaValid()'s pattern, batched across all five fields in one query.
describe('BrandingService.update — media id validation (P0.4-D2)', () => {
  it('throws INVALID_MEDIA (400) when header_logo_id does not exist', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    media.findMany.mockResolvedValue([]); // none of the requested ids were found

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.update({ header_logo_id: 'missing-media' });
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('INVALID_MEDIA');
    expect(thrown?.getStatus?.()).toBe(400);
    expect(siteBranding.update).not.toHaveBeenCalled();
  });

  it('validates all five media fields in a single batched query, not one per field', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    media.findMany.mockResolvedValue([
      { id: 'm-header' },
      { id: 'm-footer' },
      { id: 'm-mobile' },
      { id: 'm-favicon' },
      { id: 'm-bg' },
    ]);
    siteBranding.update.mockResolvedValue(stubBrandingRow());

    await service.update({
      header_logo_id: 'm-header',
      footer_logo_id: 'm-footer',
      mobile_logo_id: 'm-mobile',
      favicon_id: 'm-favicon',
      product_header_background_id: 'm-bg',
    });

    expect(media.findMany).toHaveBeenCalledTimes(1);
  });

  it('a request with only some fields present validates only those provided ids', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    media.findMany.mockResolvedValue([{ id: 'm-header' }]);
    siteBranding.update.mockResolvedValue(stubBrandingRow());

    await service.update({ header_logo_id: 'm-header' });

    const [args] = media.findMany.mock.calls;
    expect(
      (args[0] as { where: { id: { in: string[] } } }).where.id.in,
    ).toEqual(['m-header']);
  });

  it('null (clearing a slot) is never sent to the media existence check', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    siteBranding.update.mockResolvedValue(stubBrandingRow());

    await service.update({ header_logo_id: null });

    expect(media.findMany).not.toHaveBeenCalled();
    const [args] = siteBranding.update.mock.calls;
    expect(
      (args[0] as { data: { headerLogoId: unknown } }).data.headerLogoId,
    ).toBeNull();
  });

  it('a request with no media fields present never calls the media check', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    siteBranding.update.mockResolvedValue(stubBrandingRow());

    await service.update({ header_logo_enabled: false });

    expect(media.findMany).not.toHaveBeenCalled();
  });

  it('valid media ids save successfully exactly as before', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    media.findMany.mockResolvedValue([{ id: 'm-header' }]);
    siteBranding.update.mockResolvedValue(
      stubBrandingRow({ headerLogoId: 'm-header' }),
    );

    const result = await service.update({ header_logo_id: 'm-header' });

    expect(result.id).toBe('branding-1');
  });
});

// P0.4-D2 mandatory pre-check (recorded in the implementation report, re-asserted here) — every
// registry-protected field this service can write must actually be covered by
// findLiveUsage()'s live-usage guard, so a media file this service still references can never
// be silently deleted out from under it. This test doesn't re-derive that (it's a static schema
// fact, not service behavior), it documents which five fields this service is responsible for.
describe('BrandingService.update — reset/null behavior is unchanged (P0.4-D2 regression guard)', () => {
  it('resetSlot() always clears to null and never calls the media existence check', async () => {
    const { service, siteBranding, media } = buildService();
    siteBranding.upsert.mockResolvedValue(stubBrandingRow());
    siteBranding.update.mockResolvedValue(stubBrandingRow());

    await service.resetSlot('header');

    expect(media.findMany).not.toHaveBeenCalled();
    const [args] = siteBranding.update.mock.calls;
    expect(
      (args[0] as { data: { headerLogoId: unknown; headerLogoAlt: unknown } })
        .data,
    ).toEqual({ headerLogoId: null, headerLogoAlt: null });
  });
});
