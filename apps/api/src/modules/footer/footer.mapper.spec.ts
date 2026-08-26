import { toFooterSettings } from './footer.mapper';
import type { FooterSettingsWithRelations } from './footer.mapper';

function stubFooterRow(
  overrides: Partial<FooterSettingsWithRelations> = {},
): FooterSettingsWithRelations {
  return {
    id: 'footer-1',
    singleton: true,
    enabled: true,
    showCta: true,
    showSocial: true,
    showContact: true,
    showNavigation: true,
    companyName: 'CV. Putri Palma Nusantara',
    tagline: 'Coconut Products for Global Markets',
    description:
      'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
    backgroundImageId: null,
    backgroundImage: null,
    mobileBackgroundImageId: null,
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

const translations = {
  id: {
    tagline: 'Produk Kelapa untuk Pasar Global',
    description: 'Produk kelapa Indonesia untuk pasar lokal dan internasional.',
  },
  zh: {
    tagline: '面向全球市场的椰子产品',
    description: '为本地和国际市场提供印度尼西亚椰子产品。',
  },
  th: {
    tagline: 'ผลิตภัณฑ์มะพร้าวสำหรับตลาดโลก',
    description: 'ผลิตภัณฑ์มะพร้าวอินโดนีเซียสำหรับตลาดในและต่างประเทศ',
  },
  hi: {
    tagline: 'वैश्विक बाजारों के लिए नारियल उत्पाद',
    description:
      'स्थानीय और अंतरराष्ट्रीय बाजारों के लिए इंडोनेशियाई नारियल उत्पाद।',
  },
  vi: {
    tagline: 'Sản Phẩm Dừa Cho Thị Trường Toàn Cầu',
    description: 'Sản phẩm dừa Indonesia cho thị trường trong nước và quốc tế.',
  },
};

// Phase P0.3-B3-A — Footer had zero locale awareness anywhere: no `translations` column, no
// locale param on the public controller/service/mapper, and the frontend fetch never sent one.
// These tests prove the fix: the same `translate()` mechanism every other translated field in
// this codebase already uses, wired into `toFooterSettings()`.
describe('toFooterSettings — locale resolution (Phase P0.3-B3-A)', () => {
  it('returns the base (English) tagline/description for the default "en" locale', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'en');
    expect(result.tagline).toBe('Coconut Products for Global Markets');
    expect(result.description).toBe(
      'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
    );
  });

  it('returns the Indonesian translation for "id"', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'id');
    expect(result.tagline).toBe('Produk Kelapa untuk Pasar Global');
    expect(result.description).toBe(
      'Produk kelapa Indonesia untuk pasar lokal dan internasional.',
    );
  });

  it('returns the Chinese translation for "zh"', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'zh');
    expect(result.tagline).toBe('面向全球市场的椰子产品');
    expect(result.description).toBe('为本地和国际市场提供印度尼西亚椰子产品。');
  });

  it('returns the Thai translation for "th"', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'th');
    expect(result.tagline).toBe('ผลิตภัณฑ์มะพร้าวสำหรับตลาดโลก');
    expect(result.description).toBe(
      'ผลิตภัณฑ์มะพร้าวอินโดนีเซียสำหรับตลาดในและต่างประเทศ',
    );
  });

  it('returns the Hindi translation for "hi"', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'hi');
    expect(result.tagline).toBe('वैश्विक बाजारों के लिए नारियल उत्पाद');
    expect(result.description).toBe(
      'स्थानीय और अंतरराष्ट्रीय बाजारों के लिए इंडोनेशियाई नारियल उत्पाद।',
    );
  });

  it('returns the Vietnamese translation for "vi"', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'vi');
    expect(result.tagline).toBe('Sản Phẩm Dừa Cho Thị Trường Toàn Cầu');
    expect(result.description).toBe(
      'Sản phẩm dừa Indonesia cho thị trường trong nước và quốc tế.',
    );
  });

  it('falls back to the base tagline/description when the requested locale has no translation (backward compatibility: an existing untranslated row shows identically in every locale, exactly as before this fix)', () => {
    const row = stubFooterRow({ translations: null });
    const result = toFooterSettings(row, 'zh');
    expect(result.tagline).toBe('Coconut Products for Global Markets');
    expect(result.description).toBe(
      'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
    );
  });

  it('a legacy row with translations = null resolves correctly for every locale', () => {
    const legacyRow = stubFooterRow({ translations: null });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      const result = toFooterSettings(legacyRow, locale);
      expect(result.tagline).toBe('Coconut Products for Global Markets');
      expect(result.description).toBe(
        'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
      );
    }
  });

  it('falls back to the base description when the locale block exists but description is empty', () => {
    const row = stubFooterRow({
      translations: { id: { tagline: 'Tagline ID', description: '' } },
    });
    const result = toFooterSettings(row, 'id');
    expect(result.tagline).toBe('Tagline ID');
    expect(result.description).toBe(
      'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
    );
  });

  it('mapper correctly resolves the requested locale, not always English', () => {
    const row = stubFooterRow({ translations });
    const en = toFooterSettings(row, 'en');
    const th = toFooterSettings(row, 'th');
    expect(en.tagline).not.toBe(th.tagline);
  });

  it('does not change non-translatable fields (company_name, toggles, media, colors, cta_*) across locales', () => {
    const row = stubFooterRow({
      translations,
      companyName: 'CV. Putri Palma Nusantara',
      enabled: true,
      showSocial: false,
      overlayType: 'charcoal',
      overlayOpacity: 55,
      ctaHeadline: 'Ready to Source from Indonesia?',
    });
    const resultEn = toFooterSettings(row, 'en');
    const resultZh = toFooterSettings(row, 'zh');
    expect(resultEn.company_name).toBe('CV. Putri Palma Nusantara');
    expect(resultEn.show_social).toBe(false);
    expect(resultEn.overlay_type).toBe('charcoal');
    expect(resultEn.overlay_opacity).toBe(55);
    expect(resultEn.cta_headline).toBe('Ready to Source from Indonesia?');
    // Identical regardless of which locale's tagline/description was resolved — translation
    // must never leak into non-translated fields.
    expect(resultZh.company_name).toBe(resultEn.company_name);
    expect(resultZh.show_social).toBe(resultEn.show_social);
    expect(resultZh.overlay_type).toBe(resultEn.overlay_type);
    expect(resultZh.overlay_opacity).toBe(resultEn.overlay_opacity);
    expect(resultZh.cta_headline).toBe(resultEn.cta_headline);
  });

  it('surfaces the raw translations object unchanged, for the admin editor to read directly', () => {
    const row = stubFooterRow({ translations });
    const result = toFooterSettings(row, 'en');
    expect(result.translations).toEqual(translations);
  });
});
