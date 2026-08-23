import { PageHeaderService } from './page-header.service';
import { Prisma } from '../../../generated/prisma/client';
import type { MediaService } from '../../media/media.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const pageHeader = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const service = new PageHeaderService(
    { pageHeader } as unknown as PrismaService,
    {} as unknown as MediaService,
  );
  return { service, pageHeader };
}

function stubRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'header-1',
    pageKey: 'facilities',
    isActive: true,
    backgroundImage: null,
    mobileBackgroundImage: null,
    altText: null,
    customTitle: 'Our Facilities',
    subtitle: 'Purpose-built infrastructure.',
    overlayEnabled: null,
    overlayType: null,
    overlayOpacity: null,
    backgroundPosition: null,
    mobileBackgroundPosition: null,
    heightPreset: null,
    titleColor: null,
    subtitleColor: null,
    breadcrumbColor: null,
    showBreadcrumb: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

// Phase P0.3-B2 — `update()` now merges `translations` via `mergeTranslations()` (the same
// helper every other translation-bearing module's update path already uses), instead of
// wholesale-replacing the column. These prove a single-locale partial payload against a row
// that already has other locales saved cannot erase them.
describe('PageHeaderService.update — translation merge safety (Phase P0.3-B2)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(
      stubRow({
        translations: {
          id: { customTitle: 'Fasilitas Kami' },
          zh: { customTitle: '我们的设施' },
          th: { customTitle: 'สิ่งอำนวยความสะดวกของเรา' },
        },
      }),
    );
    pageHeader.update.mockResolvedValue(stubRow());

    await service.update('facilities', {
      translations: { hi: { customTitle: 'हमारी सुविधाएं' } },
    });

    const [call] = pageHeader.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.hi).toEqual({
      customTitle: 'हमारी सुविधाएं',
    });
    expect(call.data.translations.id).toEqual({
      customTitle: 'Fasilitas Kami',
    });
    expect(call.data.translations.zh).toEqual({ customTitle: '我们的设施' });
    expect(call.data.translations.th).toEqual({
      customTitle: 'สิ่งอำนวยความสะดวกของเรา',
    });
  });

  it('updating one field within a locale preserves the other field already saved for that same locale', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(
      stubRow({
        translations: {
          id: { customTitle: 'Fasilitas Kami', subtitle: 'Subtitle lama.' },
        },
      }),
    );
    pageHeader.update.mockResolvedValue(stubRow());

    await service.update('facilities', {
      translations: { id: { customTitle: 'Fasilitas Kami (baru)' } },
    });

    const [call] = pageHeader.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      customTitle: 'Fasilitas Kami (baru)',
      subtitle: 'Subtitle lama.',
    });
  });

  it('does not touch translations when the caller omits it from the patch', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(stubRow());
    pageHeader.update.mockResolvedValue(stubRow());

    await service.update('facilities', { custom_title: 'Renamed' });

    const [call] = pageHeader.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('a legacy row with no translations object at all still updates successfully (backward compatibility)', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(stubRow({ translations: null }));
    pageHeader.update.mockResolvedValue(stubRow());

    await expect(
      service.update('facilities', {
        translations: { id: { customTitle: 'Fasilitas Kami' } },
      }),
    ).resolves.toBeDefined();

    const [call] = pageHeader.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      customTitle: 'Fasilitas Kami',
    });
  });

  it('does not change unrelated fields (background, overlay, colors) when only translations are patched', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(stubRow());
    pageHeader.update.mockResolvedValue(stubRow());

    await service.update('facilities', {
      translations: { id: { customTitle: 'Fasilitas Kami' } },
    });

    const [call] = pageHeader.update.mock.calls[0] as [
      {
        data: {
          backgroundImageId: unknown;
          overlayEnabled: unknown;
          titleColor: unknown;
        };
      },
    ];
    expect(call.data.backgroundImageId).toBeUndefined();
    expect(call.data.overlayEnabled).toBeUndefined();
    expect(call.data.titleColor).toBeUndefined();
  });
});

describe('PageHeaderService.reset — clears translations along with the base title/subtitle', () => {
  it('resets translations to JsonNull so a cleared title cannot resurrect via a stale translation', async () => {
    const { service, pageHeader } = buildService();
    pageHeader.findUnique.mockResolvedValue(
      stubRow({ translations: { id: { customTitle: 'Fasilitas Kami' } } }),
    );
    pageHeader.update.mockResolvedValue(
      stubRow({ customTitle: null, subtitle: null, translations: null }),
    );

    await service.reset('facilities');

    const [call] = pageHeader.update.mock.calls[0] as [
      {
        data: {
          customTitle: unknown;
          subtitle: unknown;
          translations: unknown;
        };
      },
    ];
    expect(call.data.customTitle).toBeNull();
    expect(call.data.subtitle).toBeNull();
    // `Prisma.JsonNull` is a distinct sentinel singleton, not the JS literal `null` — Prisma
    // needs it to tell "set this JSON column's SQL value to NULL" apart from "leave it
    // untouched" (a plain `null` in a Prisma `data` object means the latter for JSON fields).
    expect(call.data.translations).toBe(Prisma.JsonNull);
  });
});
