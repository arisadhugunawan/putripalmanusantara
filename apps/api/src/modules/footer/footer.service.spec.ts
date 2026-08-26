import { FooterService } from './footer.service';
import type { AiTranslationService } from '../ai/ai-translation.service';
import type { MediaService } from '../../media/media.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const footerSettings = {
    upsert: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const service = new FooterService(
    { footerSettings } as unknown as PrismaService,
    {} as unknown as MediaService,
    {} as unknown as AiTranslationService,
  );
  return { service, footerSettings };
}

function stubRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'footer-1',
    enabled: true,
    showCta: true,
    showSocial: true,
    showContact: true,
    showNavigation: true,
    companyName: 'CV. Putri Palma Nusantara',
    tagline: 'Coconut Products for Global Markets',
    description:
      'Indonesian coconut products for local and international markets.',
    backgroundImage: null,
    mobileBackgroundImage: null,
    backgroundAltText: null,
    overlayType: 'dark_green',
    overlayOpacity: 70,
    backgroundPosition: 'center',
    mobileBackgroundPosition: 'center',
    ctaHeadline: 'Ready to Source from Indonesia?',
    ctaDescription: 'Talk to our team.',
    ctaPrimaryText: 'Explore Products',
    ctaSecondaryText: 'Talk to PPN',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

// Phase P0.3-B3-A — `update()` now merges `translations` via `mergeTranslations()` (the same
// helper every other translation-bearing module's update path already uses), instead of
// wholesale-replacing the column. These prove a single-locale partial payload against a row
// that already has other locales saved cannot erase them.
describe('FooterService.update — translation merge safety (Phase P0.3-B3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(
      stubRow({
        translations: {
          en: { tagline: 'Coconut Products for Global Markets' },
          zh: { tagline: '面向全球市场的椰子产品' },
          th: { tagline: 'ผลิตภัณฑ์มะพร้าวสำหรับตลาดโลก' },
          hi: { tagline: 'वैश्विक बाजारों के लिए नारियल उत्पाद' },
          vi: { tagline: 'Sản Phẩm Dừa Cho Thị Trường Toàn Cầu' },
        },
      }),
    );
    footerSettings.update.mockResolvedValue(stubRow());

    await service.update({
      translations: { id: { tagline: 'Produk Kelapa untuk Pasar Global' } },
    });

    const [call] = footerSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      tagline: 'Produk Kelapa untuk Pasar Global',
    });
    expect(call.data.translations.en).toEqual({
      tagline: 'Coconut Products for Global Markets',
    });
    expect(call.data.translations.zh).toEqual({
      tagline: '面向全球市场的椰子产品',
    });
    expect(call.data.translations.th).toEqual({
      tagline: 'ผลิตภัณฑ์มะพร้าวสำหรับตลาดโลก',
    });
    expect(call.data.translations.hi).toEqual({
      tagline: 'वैश्विक बाजारों के लिए नारियल उत्पाद',
    });
    expect(call.data.translations.vi).toEqual({
      tagline: 'Sản Phẩm Dừa Cho Thị Trường Toàn Cầu',
    });
  });

  it('updating one field within a locale preserves the other field already saved for that same locale', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(
      stubRow({
        translations: {
          id: { tagline: 'Tagline lama', description: 'Deskripsi lama' },
        },
      }),
    );
    footerSettings.update.mockResolvedValue(stubRow());

    await service.update({
      translations: { id: { tagline: 'Tagline baru' } },
    });

    const [call] = footerSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      tagline: 'Tagline baru',
      description: 'Deskripsi lama',
    });
  });

  it('does not touch translations when the caller omits it from the patch (existing translations remain unchanged)', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(
      stubRow({ translations: { id: { tagline: 'Tagline lama' } } }),
    );
    footerSettings.update.mockResolvedValue(stubRow());

    await service.update({ company_name: 'Renamed' });

    const [call] = footerSettings.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('a legacy row with no translations object at all still updates successfully (backward compatibility)', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(stubRow({ translations: null }));
    footerSettings.update.mockResolvedValue(stubRow());

    await expect(
      service.update({ translations: { id: { tagline: 'Tagline baru' } } }),
    ).resolves.toBeDefined();

    const [call] = footerSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ tagline: 'Tagline baru' });
  });

  it('does not change non-translatable fields (toggles, media, colors, company_name) when only translations are patched', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(stubRow());
    footerSettings.update.mockResolvedValue(stubRow());

    await service.update({
      translations: { id: { tagline: 'Tagline baru' } },
    });

    const [call] = footerSettings.update.mock.calls[0] as [
      {
        data: {
          enabled: unknown;
          companyName: unknown;
          backgroundImageId: unknown;
          overlayType: unknown;
          ctaHeadline: unknown;
        };
      },
    ];
    expect(call.data.enabled).toBeUndefined();
    expect(call.data.companyName).toBeUndefined();
    expect(call.data.backgroundImageId).toBeUndefined();
    expect(call.data.overlayType).toBeUndefined();
    expect(call.data.ctaHeadline).toBeUndefined();
  });
});

describe('FooterService.find — locale threading', () => {
  it('passes the requested locale through to the mapper', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(
      stubRow({
        translations: { zh: { tagline: '面向全球市场的椰子产品' } },
      }),
    );

    const result = await service.find('zh');

    expect(result.tagline).toBe('面向全球市场的椰子产品');
  });

  it('falls back to the base value when no locale is passed', async () => {
    const { service, footerSettings } = buildService();
    footerSettings.upsert.mockResolvedValue(
      stubRow({
        translations: { zh: { tagline: '面向全球市场的椰子产品' } },
      }),
    );

    const result = await service.find();

    expect(result.tagline).toBe('Coconut Products for Global Markets');
  });
});
