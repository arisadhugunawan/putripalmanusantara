import type { ContactPageSettings as SharedContactPageSettings } from '@ppn/shared-types';
import {
  resolveContactLocationsLocale,
  resolveContactPageSettingsLocale,
  toContactLocation,
  toContactPageSettings,
} from './contact-page.mapper';

function stubSettingsRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    email: 'export@ppn.co.id',
    whatsappNumber: '6282293807717',
    businessHoursOpenDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    businessHoursOpenTime: '08:00',
    businessHoursCloseTime: '17:00',
    businessHoursUtcOffset: 7,
    heroEyebrow: 'Contact PPN',
    heroHeading: 'Connect With Our Team',
    heroDescription: 'Whether you are an international buyer...',
    heroImage: null,
    heroOverlayOpacity: 55,
    heroCtaPrimaryText: 'Talk to PPN',
    heroCtaSecondaryText: 'View Our Locations',
    buyerCtaHeading: 'Looking for Reliable Indonesian Coconut Supply?',
    buyerCtaDescription: 'Explore PPN products.',
    buyerCtaButtonText: 'Explore Our Products',
    supplierCtaHeading: 'Looking to Supply PPN?',
    supplierCtaDescription: 'We welcome farmers and suppliers.',
    supplierCtaButtonText: 'Talk to Our Supply Team',
    supplierCtaWhatsappMessage:
      'Hello PPN Team, I am interested in becoming a supplier.',
    whatsappMessageGreeting: 'Hello PPN Team,',
    whatsappMessageIntro: 'I am interested in PPN coconut products.',
    whatsappMessageProductListLabel: 'Products I am interested in:',
    whatsappMessageClosing: 'Thank you.',
    mainMapLocationId: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  };
}

const translations = {
  id: {
    heroEyebrow: 'Hubungi PPN',
    heroHeading: 'Terhubung dengan Tim Kami',
    heroDescription: 'Baik Anda pembeli internasional...',
    whatsappMessageGreeting: 'Halo Tim PPN,',
    whatsappMessageIntro: 'Saya tertarik dengan produk kelapa PPN.',
    whatsappMessageProductListLabel: 'Produk yang saya minati:',
    whatsappMessageClosing: 'Terima kasih.',
  },
  zh: {
    heroEyebrow: '联系PPN',
    heroHeading: '与我们的团队联系',
    heroDescription: '无论您是国际买家...',
    whatsappMessageGreeting: '您好PPN团队，',
    whatsappMessageIntro: '我对PPN的椰子产品感兴趣。',
    whatsappMessageProductListLabel: '我感兴趣的产品：',
    whatsappMessageClosing: '谢谢。',
  },
  th: {
    heroEyebrow: 'ติดต่อ PPN',
    heroHeading: 'เชื่อมต่อกับทีมของเรา',
    heroDescription: 'ไม่ว่าคุณจะเป็นผู้ซื้อระหว่างประเทศ...',
    whatsappMessageGreeting: 'สวัสดีทีม PPN,',
    whatsappMessageIntro: 'ฉันสนใจผลิตภัณฑ์มะพร้าวของ PPN',
    whatsappMessageProductListLabel: 'สินค้าที่ฉันสนใจ:',
    whatsappMessageClosing: 'ขอบคุณ',
  },
  hi: {
    heroEyebrow: 'PPN से संपर्क करें',
    heroHeading: 'हमारी टीम से जुड़ें',
    heroDescription: 'चाहे आप अंतरराष्ट्रीय खरीदार हों...',
    whatsappMessageGreeting: 'नमस्ते PPN टीम,',
    whatsappMessageIntro: 'मुझे PPN के नारियल उत्पादों में रुचि है।',
    whatsappMessageProductListLabel: 'मुझे रुचि रखने वाले उत्पाद:',
    whatsappMessageClosing: 'धन्यवाद।',
  },
  vi: {
    heroEyebrow: 'Liên Hệ PPN',
    heroHeading: 'Kết Nối Với Đội Ngũ Của Chúng Tôi',
    heroDescription: 'Cho dù bạn là người mua quốc tế...',
    whatsappMessageGreeting: 'Xin chào Đội ngũ PPN,',
    whatsappMessageIntro: 'Tôi quan tâm đến sản phẩm dừa của PPN.',
    whatsappMessageProductListLabel: 'Sản phẩm tôi quan tâm:',
    whatsappMessageClosing: 'Cảm ơn.',
  },
};

// Phase P0.3-B3-B — Contact had zero locale awareness anywhere. `toContactPageSettings()`
// always returned the base (English) fields with no `translations` passthrough, and the public
// read path (`ContactPageService.getPublished()`) served a frozen, English-only snapshot with
// no way to resolve a locale at all. These tests prove `resolveContactPageSettingsLocale()` —
// the counterpart, used against the frozen snapshot JSON rather than a live Prisma row.
describe('toContactPageSettings — translations passthrough (Phase P0.3-B3-B)', () => {
  it('carries the raw translations object through unchanged, for the admin editor to read directly', () => {
    const row = stubSettingsRow({ translations });
    const result = toContactPageSettings(row);
    expect(result.translations).toEqual(translations);
  });

  it('a legacy row with translations = null maps successfully (backward compatibility)', () => {
    const row = stubSettingsRow({ translations: null });
    const result = toContactPageSettings(row);
    expect(result.translations).toBeNull();
    expect(result.hero_heading).toBe('Connect With Our Team');
  });

  it('does not translate the dead cta_* fields or any non-translatable field', () => {
    const row = stubSettingsRow({ translations });
    const result = toContactPageSettings(row);
    expect(result.buyer_cta_heading).toBe(
      'Looking for Reliable Indonesian Coconut Supply?',
    );
    expect(result.supplier_cta_whatsapp_message).toBe(
      'Hello PPN Team, I am interested in becoming a supplier.',
    );
    expect(result.hero_cta_primary_text).toBe('Talk to PPN');
    expect(result.email).toBe('export@ppn.co.id');
    expect(result.whatsapp_number).toBe('6282293807717');
  });
});

describe('resolveContactPageSettingsLocale — locale resolution against the frozen snapshot shape (Phase P0.3-B3-B)', () => {
  function baseSettings(
    overrides: Partial<SharedContactPageSettings> = {},
  ): SharedContactPageSettings {
    return toContactPageSettings(stubSettingsRow(overrides));
  }

  it('returns the base (English) hero/WhatsApp copy for the default "en" locale', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'en');
    expect(result.hero_eyebrow).toBe('Contact PPN');
    expect(result.hero_heading).toBe('Connect With Our Team');
    expect(result.whatsapp_message_greeting).toBe('Hello PPN Team,');
  });

  it('returns the Indonesian translation for "id" — hero and WhatsApp fields alike', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'id');
    expect(result.hero_eyebrow).toBe('Hubungi PPN');
    expect(result.hero_heading).toBe('Terhubung dengan Tim Kami');
    expect(result.hero_description).toBe('Baik Anda pembeli internasional...');
    expect(result.whatsapp_message_greeting).toBe('Halo Tim PPN,');
    expect(result.whatsapp_message_intro).toBe(
      'Saya tertarik dengan produk kelapa PPN.',
    );
    expect(result.whatsapp_message_product_list_label).toBe(
      'Produk yang saya minati:',
    );
    expect(result.whatsapp_message_closing).toBe('Terima kasih.');
  });

  it('returns the Chinese translation for "zh"', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'zh');
    expect(result.hero_heading).toBe('与我们的团队联系');
    expect(result.whatsapp_message_closing).toBe('谢谢。');
  });

  it('returns the Thai translation for "th"', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'th');
    expect(result.hero_heading).toBe('เชื่อมต่อกับทีมของเรา');
  });

  it('returns the Hindi translation for "hi"', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'hi');
    expect(result.hero_heading).toBe('हमारी टीम से जुड़ें');
  });

  it('returns the Vietnamese translation for "vi"', () => {
    const settings = baseSettings({ translations });
    const result = resolveContactPageSettingsLocale(settings, 'vi');
    expect(result.hero_heading).toBe('Kết Nối Với Đội Ngũ Của Chúng Tôi');
  });

  it('falls back to the base fields when the requested locale has no translation (backward compatibility)', () => {
    const settings = baseSettings({ translations: null });
    const result = resolveContactPageSettingsLocale(settings, 'zh');
    expect(result.hero_heading).toBe('Connect With Our Team');
    expect(result.whatsapp_message_greeting).toBe('Hello PPN Team,');
  });

  it('a legacy settings object with translations = null resolves correctly for every locale', () => {
    const settings = baseSettings({ translations: null });
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi']) {
      const result = resolveContactPageSettingsLocale(settings, locale);
      expect(result.hero_heading).toBe('Connect With Our Team');
    }
  });

  it('falls back to the base value when the locale block exists but a field is empty', () => {
    const settings = baseSettings({
      translations: { id: { heroEyebrow: 'Hubungi PPN', heroHeading: '' } },
    });
    const result = resolveContactPageSettingsLocale(settings, 'id');
    expect(result.hero_eyebrow).toBe('Hubungi PPN');
    expect(result.hero_heading).toBe('Connect With Our Team');
  });

  it('never changes non-translatable or dead cta_* fields regardless of locale', () => {
    const settings = baseSettings({ translations });
    const en = resolveContactPageSettingsLocale(settings, 'en');
    const id = resolveContactPageSettingsLocale(settings, 'id');
    expect(id.email).toBe(en.email);
    expect(id.whatsapp_number).toBe(en.whatsapp_number);
    expect(id.business_hours_open_time).toBe(en.business_hours_open_time);
    expect(id.buyer_cta_heading).toBe(en.buyer_cta_heading);
    expect(id.supplier_cta_whatsapp_message).toBe(
      en.supplier_cta_whatsapp_message,
    );
  });

  it('resolves a genuinely different value per locale, not always English', () => {
    const settings = baseSettings({ translations });
    const en = resolveContactPageSettingsLocale(settings, 'en');
    const th = resolveContactPageSettingsLocale(settings, 'th');
    expect(en.hero_heading).not.toBe(th.hero_heading);
  });
});

function stubLocationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loc-1',
    name: 'Tolitoli',
    locationType: 'head_office',
    label: 'Main Warehouse',
    address: 'Jl. Tolitoli No. 1',
    googleMapsUrl: 'https://maps.app.goo.gl/tolitoli',
    phone: '+62123456789',
    email: 'tolitoli@ppn.co.id',
    order: 0,
    active: true,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    translations: null,
    ...overrides,
  } as Parameters<typeof toContactLocation>[0];
}

const locationTranslations = {
  id: { label: 'Gudang Utama' },
  zh: { label: '主要仓库' },
  th: { label: 'คลังสินค้าหลัก' },
  hi: { label: 'मुख्य गोदाम' },
  vi: { label: 'Kho chính' },
};

// Phase P0.3-B3-C — `ContactLocation.label` gains the same per-field translation support Contact
// Hero/WhatsApp got in B3-B. `name`/`address`/`google_maps_url`/`phone`/`email` must never be
// touched by this — these tests prove both the passthrough and that isolation.
describe('toContactLocation — translations passthrough (Phase P0.3-B3-C)', () => {
  it('carries the raw translations object through unchanged', () => {
    const row = stubLocationRow({ translations: locationTranslations });
    const result = toContactLocation(row);
    expect(result.translations).toEqual(locationTranslations);
  });

  it('a legacy row with translations = null maps successfully (backward compatibility)', () => {
    const row = stubLocationRow({ translations: null });
    const result = toContactLocation(row);
    expect(result.translations).toBeNull();
    expect(result.label).toBe('Main Warehouse');
  });
});

describe('resolveContactLocationsLocale — label-only locale resolution (Phase P0.3-B3-C)', () => {
  function baseLocations(overrides: Record<string, unknown> = {}) {
    return [toContactLocation(stubLocationRow(overrides))];
  }

  it('returns the base (English) label for the default "en" locale', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'en');
    expect(result.label).toBe('Main Warehouse');
  });

  it('resolves the Indonesian label for "id"', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'id');
    expect(result.label).toBe('Gudang Utama');
  });

  it('resolves the Chinese label for "zh"', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'zh');
    expect(result.label).toBe('主要仓库');
  });

  it('resolves the Thai label for "th"', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'th');
    expect(result.label).toBe('คลังสินค้าหลัก');
  });

  it('resolves the Hindi label for "hi"', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'hi');
    expect(result.label).toBe('मुख्य गोदाम');
  });

  it('resolves the Vietnamese label for "vi"', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const [result] = resolveContactLocationsLocale(locations, 'vi');
    expect(result.label).toBe('Kho chính');
  });

  it('falls back to the base label when the requested locale has no translation', () => {
    const locations = baseLocations({ translations: null });
    const [result] = resolveContactLocationsLocale(locations, 'zh');
    expect(result.label).toBe('Main Warehouse');
  });

  it('never changes name/address/google_maps_url/phone/email regardless of locale', () => {
    const locations = baseLocations({ translations: locationTranslations });
    const en = resolveContactLocationsLocale(locations, 'en')[0];
    const id = resolveContactLocationsLocale(locations, 'id')[0];
    expect(id.name).toBe(en.name);
    expect(id.address).toBe(en.address);
    expect(id.google_maps_url).toBe(en.google_maps_url);
    expect(id.phone).toBe(en.phone);
    expect(id.email).toBe(en.email);
  });

  it('editing one location does not alter translations of another location in the same array', () => {
    const locations = [
      toContactLocation(
        stubLocationRow({ id: 'loc-1', translations: locationTranslations }),
      ),
      toContactLocation(
        stubLocationRow({
          id: 'loc-2',
          label: 'Palu Facility',
          translations: null,
        }),
      ),
    ];
    const resolved = resolveContactLocationsLocale(locations, 'id');
    expect(resolved[0].label).toBe('Gudang Utama');
    expect(resolved[1].label).toBe('Palu Facility');
  });
});
