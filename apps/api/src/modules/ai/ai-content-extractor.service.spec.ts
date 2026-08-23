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

/** `extractContact()` only pulls `email`/`whatsapp_number`/`business_hours_*` (all
 * non-translatable, global fields — confirmed by reading the method) plus each active
 * location's `name`/`label`/`address`/`phone`/`email`/`google_maps_url`. `label` is the only
 * field on this payload that actually varies by locale (Phase P0.3-B3-C), so it's the field
 * these tests use to prove locale resolution — `hero_heading`/WhatsApp template fields are not
 * part of `extractContact()`'s output at all, so asserting against them would test something
 * the method doesn't do. */
function stubContactPayload(label: string) {
  return {
    settings: {
      email: 'export@ppn.co.id',
      whatsapp_number: '6282293807717',
      business_hours_open_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      business_hours_open_time: '08:00',
      business_hours_close_time: '17:00',
      business_hours_utc_offset: 7,
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
