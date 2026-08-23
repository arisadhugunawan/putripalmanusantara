import { SUPPORTED_LOCALES } from '@ppn/shared-types';
import { AiContentExtractorService } from './ai-content-extractor.service';
import type { HomepageService } from '../homepage/homepage.service';
import type { AboutCompanyService } from '../about-company/about-company.service';
import type { ProductsService } from '../products/products.service';
import type { GalleryService } from '../gallery/gallery.service';
import type { ArticlesService } from '../articles/articles.service';
import type { ContactPageService } from '../contact-page/contact-page.service';
import type { AiSettingsModel } from '../../../generated/prisma/models';

function buildService() {
  const getPublished = jest.fn();
  const contactPageService = {
    getPublished,
  } as unknown as ContactPageService;
  const service = new AiContentExtractorService(
    {} as HomepageService,
    {} as AboutCompanyService,
    {} as ProductsService,
    {} as GalleryService,
    {} as ArticlesService,
    contactPageService,
  );
  return { service, getPublished };
}

/** Every source except Contact is disabled — isolates `extractContact()` behavior from the
 * other five extractors, which are not the concern of this phase (P0.3-B3-D1). */
function contactOnlySettings(): AiSettingsModel {
  return {
    includeHome: false,
    includeAboutCompany: false,
    includeFacilities: false,
    includeMoqPaymentTerms: false,
    includeShipmentTerms: false,
    includeLegalCertificates: false,
    includeFaq: false,
    includeProducts: false,
    includeGallery: false,
    includeNews: false,
    includeContact: true,
  } as unknown as AiSettingsModel;
}

/** `extractContact()` pulls `email`/`whatsapp_number`/`business_hours_*` (non-translatable,
 * global fields), the hero copy (`hero_eyebrow`/`hero_heading`/`hero_description`) and the four
 * `whatsapp_message_*` template fields (all locale-resolved by `getPublished(language)` before
 * this method ever sees them — Phase P0.3-F), plus each active location's `name`/`label`/
 * `address`/`phone`/`email`/`google_maps_url`. `label` remains the field the pre-existing
 * locale-resolution tests below use; `heroFields`/`whatsappFields` let the Phase P0.3-F tests
 * supply distinct per-locale markers for the fields added in this phase without disturbing the
 * existing tests (both default to empty strings, which `block()` already filters out — so every
 * pre-existing test below is completely unaffected by this parameter's addition). */
function stubContactPayload(
  label: string,
  fields: {
    heroEyebrow?: string;
    heroHeading?: string;
    heroDescription?: string;
    whatsappGreeting?: string;
    whatsappIntro?: string;
    whatsappProductListLabel?: string;
    whatsappClosing?: string;
  } = {},
) {
  return {
    settings: {
      email: 'export@ppn.co.id',
      whatsapp_number: '6282293807717',
      business_hours_open_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      business_hours_open_time: '08:00',
      business_hours_close_time: '17:00',
      business_hours_utc_offset: 7,
      hero_eyebrow: fields.heroEyebrow ?? '',
      hero_heading: fields.heroHeading ?? '',
      hero_description: fields.heroDescription ?? '',
      whatsapp_message_greeting: fields.whatsappGreeting ?? '',
      whatsapp_message_intro: fields.whatsappIntro ?? '',
      whatsapp_message_product_list_label:
        fields.whatsappProductListLabel ?? '',
      whatsapp_message_closing: fields.whatsappClosing ?? '',
    },
    locations: [
      {
        id: 'loc-1',
        name: 'Tolitoli',
        label,
        address: 'Jl. Tolitoli No. 1',
        google_maps_url: 'https://maps.app.goo.gl/tolitoli',
        phone: null,
        email: null,
        active: true,
        order: 0,
      },
    ],
    social_links: [],
    main_map_location: null,
  };
}

const LABEL_BY_LOCALE: Record<string, string> = {
  en: 'Main Warehouse',
  id: 'Gudang Utama',
  zh: '主要仓库',
  th: 'คลังสินค้าหลัก',
  hi: 'मुख्य गोदाम',
  vi: 'Kho chính',
};

describe('AiContentExtractorService.extractAll — Contact locale resolution (Phase P0.3-B3-D1)', () => {
  it('requests Contact once for each supported locale, with the language argument, and never omits it', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) =>
      Promise.resolve(stubContactPayload(LABEL_BY_LOCALE[locale])),
    );

    await service.extractAll(contactOnlySettings());

    expect(getPublished).toHaveBeenCalledTimes(SUPPORTED_LOCALES.length);
    for (const locale of SUPPORTED_LOCALES) {
      expect(getPublished).toHaveBeenCalledWith(locale);
    }
  });

  it('each language-tagged chunk carries its own locale-specific location label', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) =>
      Promise.resolve(stubContactPayload(LABEL_BY_LOCALE[locale])),
    );

    const chunks = await service.extractAll(contactOnlySettings());
    const locationChunks = chunks.filter((c) => c.contentType === 'location');

    for (const locale of SUPPORTED_LOCALES) {
      const chunk = locationChunks.find((c) => c.language === locale);
      expect(chunk?.content).toContain(LABEL_BY_LOCALE[locale]);
    }
  });

  it('no cross-locale leakage — the Indonesian chunk does not contain the English label, and the Chinese chunk does not contain the Indonesian label', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) =>
      Promise.resolve(stubContactPayload(LABEL_BY_LOCALE[locale])),
    );

    const chunks = await service.extractAll(contactOnlySettings());
    const locationChunks = chunks.filter((c) => c.contentType === 'location');

    const idChunk = locationChunks.find((c) => c.language === 'id');
    const zhChunk = locationChunks.find((c) => c.language === 'zh');

    expect(idChunk?.content).not.toContain(LABEL_BY_LOCALE.en);
    expect(zhChunk?.content).not.toContain(LABEL_BY_LOCALE.id);
  });

  it('one locale failing does not abort extraction for the other five', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) => {
      if (locale === 'zh') return Promise.reject(new Error('boom'));
      return Promise.resolve(stubContactPayload(LABEL_BY_LOCALE[locale]));
    });

    const chunks = await service.extractAll(contactOnlySettings());
    const languagesPresent = new Set(chunks.map((c) => c.language));

    expect(languagesPresent.has('zh')).toBe(false);
    expect(languagesPresent.has('en')).toBe(true);
    expect(languagesPresent.has('id')).toBe(true);
    expect(languagesPresent.has('th')).toBe(true);
    expect(languagesPresent.has('hi')).toBe(true);
    expect(languagesPresent.has('vi')).toBe(true);
  });

  it('produces no chunks for a locale when getPublished() resolves null (unpublished Contact)', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockResolvedValue(null);

    const chunks = await service.extractAll(contactOnlySettings());

    expect(chunks).toHaveLength(0);
    expect(getPublished).toHaveBeenCalledTimes(SUPPORTED_LOCALES.length);
  });

  it('does not call getPublished() at all when Contact extraction is disabled', async () => {
    const { service, getPublished } = buildService();

    await service.extractAll({
      ...contactOnlySettings(),
      includeContact: false,
    });

    expect(getPublished).not.toHaveBeenCalled();
  });
});

/** Distinct, unmistakable markers per locale — per the P0.3-F brief, never generic words like
 * "Welcome"/"Contact" that could coincidentally appear in another locale's text or in the
 * static "Email:"/"WhatsApp:"/"Business hours:" labels already in the chunk. */
const FIELDS_BY_LOCALE: Record<
  'en' | 'id' | 'zh',
  {
    heroEyebrow: string;
    heroHeading: string;
    heroDescription: string;
    whatsappGreeting: string;
    whatsappIntro: string;
    whatsappProductListLabel: string;
    whatsappClosing: string;
  }
> = {
  en: {
    heroEyebrow: 'CONTACT_HERO_EN_EYEBROW',
    heroHeading: 'CONTACT_HERO_EN_HEADING',
    heroDescription: 'CONTACT_HERO_EN_DESCRIPTION',
    whatsappGreeting: 'CONTACT_WA_EN_GREETING',
    whatsappIntro: 'CONTACT_WA_EN_INTRO',
    whatsappProductListLabel: 'CONTACT_WA_EN_PRODUCT',
    whatsappClosing: 'CONTACT_WA_EN_CLOSING',
  },
  id: {
    heroEyebrow: 'CONTACT_HERO_ID_EYEBROW',
    heroHeading: 'CONTACT_HERO_ID_HEADING',
    heroDescription: 'CONTACT_HERO_ID_DESCRIPTION',
    whatsappGreeting: 'CONTACT_WA_ID_GREETING',
    whatsappIntro: 'CONTACT_WA_ID_INTRO',
    whatsappProductListLabel: 'CONTACT_WA_ID_PRODUCT',
    whatsappClosing: 'CONTACT_WA_ID_CLOSING',
  },
  zh: {
    heroEyebrow: 'CONTACT_HERO_ZH_EYEBROW',
    heroHeading: 'CONTACT_HERO_ZH_HEADING',
    heroDescription: 'CONTACT_HERO_ZH_DESCRIPTION',
    whatsappGreeting: 'CONTACT_WA_ZH_GREETING',
    whatsappIntro: 'CONTACT_WA_ZH_INTRO',
    whatsappProductListLabel: 'CONTACT_WA_ZH_PRODUCT',
    whatsappClosing: 'CONTACT_WA_ZH_CLOSING',
  },
};

function allMarkers(locale: 'en' | 'id' | 'zh'): string[] {
  return Object.values(FIELDS_BY_LOCALE[locale]);
}

describe('AiContentExtractorService.extractAll — Contact hero/WhatsApp field coverage (Phase P0.3-F)', () => {
  function buildMultiLocaleService() {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) => {
      const fields =
        locale === 'en' || locale === 'id' || locale === 'zh'
          ? FIELDS_BY_LOCALE[locale]
          : undefined;
      return Promise.resolve(
        stubContactPayload(LABEL_BY_LOCALE[locale], fields),
      );
    });
    return { service, getPublished };
  }

  it('English extraction includes the English hero fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const general = chunks.find(
      (c) => c.language === 'en' && c.contentType === 'contact_info',
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.heroEyebrow);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.heroHeading);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.heroDescription);
  });

  it('English extraction includes the English WhatsApp template fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const general = chunks.find(
      (c) => c.language === 'en' && c.contentType === 'contact_info',
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.whatsappGreeting);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.whatsappIntro);
    expect(general?.content).toContain(
      FIELDS_BY_LOCALE.en.whatsappProductListLabel,
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.en.whatsappClosing);
  });

  it('Indonesian extraction includes the Indonesian translated hero fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const general = chunks.find(
      (c) => c.language === 'id' && c.contentType === 'contact_info',
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.heroEyebrow);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.heroHeading);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.heroDescription);
  });

  it('Indonesian extraction includes the Indonesian WhatsApp template fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const general = chunks.find(
      (c) => c.language === 'id' && c.contentType === 'contact_info',
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.whatsappGreeting);
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.whatsappIntro);
    expect(general?.content).toContain(
      FIELDS_BY_LOCALE.id.whatsappProductListLabel,
    );
    expect(general?.content).toContain(FIELDS_BY_LOCALE.id.whatsappClosing);
  });

  it('Chinese extraction includes the Chinese translated hero and WhatsApp fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const general = chunks.find(
      (c) => c.language === 'zh' && c.contentType === 'contact_info',
    );
    for (const marker of allMarkers('zh')) {
      expect(general?.content).toContain(marker);
    }
  });

  it('no cross-locale leakage — English, Indonesian, and Chinese chunks each contain only their own markers', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());
    const generalByLocale = (locale: 'en' | 'id' | 'zh') =>
      chunks.find(
        (c) => c.language === locale && c.contentType === 'contact_info',
      )?.content ?? '';

    const en = generalByLocale('en');
    const id = generalByLocale('id');
    const zh = generalByLocale('zh');

    for (const marker of allMarkers('id')) expect(en).not.toContain(marker);
    for (const marker of allMarkers('zh')) expect(en).not.toContain(marker);
    for (const marker of allMarkers('en')) expect(id).not.toContain(marker);
    for (const marker of allMarkers('zh')) expect(id).not.toContain(marker);
    for (const marker of allMarkers('en')) expect(zh).not.toContain(marker);
    for (const marker of allMarkers('id')) expect(zh).not.toContain(marker);
  });

  it('existing location extraction and existing global fields (email/whatsapp/business hours) remain intact alongside the new fields', async () => {
    const { service } = buildMultiLocaleService();
    const chunks = await service.extractAll(contactOnlySettings());

    const enGeneral = chunks.find(
      (c) => c.language === 'en' && c.contentType === 'contact_info',
    );
    expect(enGeneral?.content).toContain('Email: export@ppn.co.id');
    expect(enGeneral?.content).toContain('WhatsApp: 6282293807717');
    expect(enGeneral?.content).toContain('Business hours:');

    const enLocation = chunks.find(
      (c) => c.language === 'en' && c.contentType === 'location',
    );
    expect(enLocation?.content).toContain(LABEL_BY_LOCALE.en);
    expect(enLocation?.content).toContain('Tolitoli');
  });

  it('getPublished(language) is still called exactly once per supported locale', async () => {
    const { service, getPublished } = buildMultiLocaleService();
    await service.extractAll(contactOnlySettings());
    expect(getPublished).toHaveBeenCalledTimes(SUPPORTED_LOCALES.length);
    for (const locale of SUPPORTED_LOCALES) {
      const callsForLocale = getPublished.mock.calls.filter(
        ([arg]: [string]) => arg === locale,
      );
      expect(callsForLocale).toHaveLength(1);
    }
  });

  it('one locale failing getPublished() still isolates that locale — other locales, including their new hero/WhatsApp fields, extract normally', async () => {
    const { service, getPublished } = buildService();
    getPublished.mockImplementation((locale: string) => {
      if (locale === 'zh') return Promise.reject(new Error('boom'));
      const fields =
        locale === 'en' || locale === 'id'
          ? FIELDS_BY_LOCALE[locale]
          : undefined;
      return Promise.resolve(
        stubContactPayload(LABEL_BY_LOCALE[locale], fields),
      );
    });

    const chunks = await service.extractAll(contactOnlySettings());

    expect(chunks.some((c) => c.language === 'zh')).toBe(false);
    const enGeneral = chunks.find(
      (c) => c.language === 'en' && c.contentType === 'contact_info',
    );
    expect(enGeneral?.content).toContain(FIELDS_BY_LOCALE.en.heroHeading);
    const idGeneral = chunks.find(
      (c) => c.language === 'id' && c.contentType === 'contact_info',
    );
    expect(idGeneral?.content).toContain(FIELDS_BY_LOCALE.id.whatsappGreeting);
  });
});
