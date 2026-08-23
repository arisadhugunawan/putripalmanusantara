import { resolvePageHeader, toPageHeader } from './page-header.mapper';
import type { PageHeaderWithRelations } from './page-header.mapper';

function stubPageHeaderRow(
  overrides: Partial<PageHeaderWithRelations> = {},
): PageHeaderWithRelations {
  return {
    id: 'header-1',
    pageKey: 'facilities',
    isActive: true,
    backgroundImageId: null,
    backgroundImage: null,
    mobileBackgroundImageId: null,
    mobileBackgroundImage: null,
    altText: null,
    customTitle: 'Our Facilities',
    subtitle: 'Purpose-built infrastructure behind every shipment.',
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

const translations = {
  id: {
    customTitle: 'Fasilitas Kami',
    subtitle: 'Infrastruktur untuk setiap pengiriman.',
  },
  zh: { customTitle: '我们的设施', subtitle: '每次发货背后的基础设施。' },
  th: {
    customTitle: 'สิ่งอำนวยความสะดวกของเรา',
    subtitle: 'โครงสร้างพื้นฐานเบื้องหลังการจัดส่งทุกครั้ง',
  },
  hi: {
    customTitle: 'हमारी सुविधाएं',
    subtitle: 'हर शिपमेंट के पीछे का बुनियादी ढांचा।',
  },
  vi: {
    customTitle: 'Cơ Sở Của Chúng Tôi',
    subtitle: 'Cơ sở hạ tầng đằng sau mỗi lô hàng.',
  },
};

// Phase P0.3-B2 — root cause was that `resolvePageHeader()` had no locale concept at all: it
// read `page?.customTitle` raw, so a plain custom title set once was reused unchanged for every
// locale, silently overriding the correctly-localized dictionary default (see the caller's own
// `config?.custom_title || title` fallback in PageHeaderPreview.tsx, which trusts the backend to
// have already resolved `custom_title` for the right locale). These tests prove the fix: the
// same `translate()` mechanism every other translated field in this codebase already uses.
describe('resolvePageHeader — locale resolution (Phase P0.3-B2)', () => {
  it('EN (default locale) returns the base custom_title/subtitle untouched', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'en');
    expect(result.custom_title).toBe('Our Facilities');
    expect(result.subtitle).toBe(
      'Purpose-built infrastructure behind every shipment.',
    );
  });

  it('ID returns the Indonesian translation', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'id');
    expect(result.custom_title).toBe('Fasilitas Kami');
    expect(result.subtitle).toBe('Infrastruktur untuk setiap pengiriman.');
  });

  it('ZH returns the Chinese translation', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'zh');
    expect(result.custom_title).toBe('我们的设施');
    expect(result.subtitle).toBe('每次发货背后的基础设施。');
  });

  it('TH returns the Thai translation', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'th');
    expect(result.custom_title).toBe('สิ่งอำนวยความสะดวกของเรา');
    expect(result.subtitle).toBe('โครงสร้างพื้นฐานเบื้องหลังการจัดส่งทุกครั้ง');
  });

  it('HI returns the Hindi translation', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'hi');
    expect(result.custom_title).toBe('हमारी सुविधाएं');
    expect(result.subtitle).toBe('हर शिपमेंट के पीछे का बुनियादी ढांचा।');
  });

  it('VI returns the Vietnamese translation', () => {
    const page = stubPageHeaderRow({ translations });
    const result = resolvePageHeader(page, null, 'vi');
    expect(result.custom_title).toBe('Cơ Sở Của Chúng Tôi');
    expect(result.subtitle).toBe('Cơ sở hạ tầng đằng sau mỗi lô hàng.');
  });

  it('falls back to the base custom_title when the requested locale has no translation — this is the exact backward-compatibility case: a page with a plain, never-translated custom title must keep showing that same text in every locale, unchanged from before this fix', () => {
    const page = stubPageHeaderRow({ translations: null });
    const result = resolvePageHeader(page, null, 'zh');
    expect(result.custom_title).toBe('Our Facilities');
    expect(result.subtitle).toBe(
      'Purpose-built infrastructure behind every shipment.',
    );
  });

  it('falls back to the base subtitle when the locale block exists but subtitle is empty', () => {
    const page = stubPageHeaderRow({
      translations: { id: { customTitle: 'Fasilitas Kami', subtitle: '' } },
    });
    const result = resolvePageHeader(page, null, 'id');
    expect(result.custom_title).toBe('Fasilitas Kami');
    expect(result.subtitle).toBe(
      'Purpose-built infrastructure behind every shipment.',
    );
  });

  it('subtitle falls through to the global-default row (translated) when the page row has none', () => {
    const page = stubPageHeaderRow({ subtitle: null, translations: null });
    const global = stubPageHeaderRow({
      pageKey: 'global-default',
      customTitle: null,
      subtitle: 'Global fallback subtitle.',
      translations: { id: { subtitle: 'Subtitle cadangan global.' } },
    });
    const result = resolvePageHeader(page, global, 'id');
    expect(result.subtitle).toBe('Subtitle cadangan global.');
  });

  it('custom_title is never read from the global-default row, translated or not', () => {
    const page = stubPageHeaderRow({ customTitle: null, translations: null });
    const global = stubPageHeaderRow({
      pageKey: 'global-default',
      customTitle: 'Should never surface',
      translations: { id: { customTitle: 'Should also never surface' } },
    });
    const result = resolvePageHeader(page, global, 'id');
    expect(result.custom_title).toBeNull();
  });

  it('a legacy row with a plain custom_title and no translations object at all resolves correctly for every locale (existing content remains visible after deployment)', () => {
    const legacyPage = stubPageHeaderRow({ translations: undefined });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      const result = resolvePageHeader(legacyPage, null, locale);
      expect(result.custom_title).toBe('Our Facilities');
    }
  });

  it('mapper correctly resolves the requested locale, not always English, when no locale argument is a mistake to omit', () => {
    const page = stubPageHeaderRow({ translations });
    const en = resolvePageHeader(page, null, 'en');
    const th = resolvePageHeader(page, null, 'th');
    expect(en.custom_title).not.toBe(th.custom_title);
  });

  it('does not change unrelated resolved fields (background image, overlay, colors, height)', () => {
    const page = stubPageHeaderRow({
      translations,
      overlayEnabled: true,
      overlayType: 'dark',
      overlayOpacity: 50,
      heightPreset: 'tall',
      titleColor: '#123456',
    });
    const resultEn = resolvePageHeader(page, null, 'en');
    const resultZh = resolvePageHeader(page, null, 'zh');
    expect(resultEn.overlay_enabled).toBe(true);
    expect(resultEn.overlay_type).toBe('dark');
    expect(resultEn.overlay_opacity).toBe(50);
    expect(resultEn.height_preset).toBe('tall');
    expect(resultEn.title_color).toBe('#123456');
    // Same non-translated fields must be identical regardless of which locale's title/subtitle
    // was resolved — translation must never leak into unrelated design fields.
    expect(resultZh.overlay_enabled).toBe(resultEn.overlay_enabled);
    expect(resultZh.overlay_type).toBe(resultEn.overlay_type);
    expect(resultZh.overlay_opacity).toBe(resultEn.overlay_opacity);
    expect(resultZh.height_preset).toBe(resultEn.height_preset);
    expect(resultZh.title_color).toBe(resultEn.title_color);
  });
});

describe('toPageHeader — surfaces the raw translations object for the admin editor', () => {
  it('passes translations through unchanged', () => {
    const page = stubPageHeaderRow({ translations });
    const result = toPageHeader(page);
    expect(result.translations).toEqual(translations);
  });

  it('passes null translations through unchanged', () => {
    const page = stubPageHeaderRow({ translations: null });
    const result = toPageHeader(page);
    expect(result.translations).toBeNull();
  });
});
