import type { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { HomepageService } from './homepage.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ProductionStepsService } from '../production-steps/production-steps.service';
import type { SupplyNetworkService } from '../supply-network/supply-network.service';

function buildService() {
  const homepagePublishedSnapshot = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
  };
  const heroSlide = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageAboutPreview = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const partnerLogo = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const shippingPartner = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageHighlight = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepagePartnersSection = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageShippingSection = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageWhyChooseUs = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const exportDestination = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageExportReach = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = {
    homepagePublishedSnapshot,
    heroSlide,
    homepageAboutPreview,
    partnerLogo,
    shippingPartner,
    homepageHighlight,
    homepagePartnersSection,
    homepageShippingSection,
    homepageWhyChooseUs,
    exportDestination,
    homepageExportReach,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const events = { emit: jest.fn() };
  return {
    service: new HomepageService(
      prisma as unknown as PrismaService,
      {} as unknown as ProductionStepsService,
      {} as unknown as SupplyNetworkService,
      events as unknown as EventEmitter2,
    ),
    homepagePublishedSnapshot,
    heroSlide,
    homepageAboutPreview,
    partnerLogo,
    shippingPartner,
    homepageHighlight,
    homepagePartnersSection,
    homepageShippingSection,
    homepageWhyChooseUs,
    exportDestination,
    homepageExportReach,
    events,
  };
}

describe('HomepageService.restoreSnapshot', () => {
  it('emits content.published with source="home" after the restore transaction commits', async () => {
    const { service, homepagePublishedSnapshot, events } = buildService();
    homepagePublishedSnapshot.findUnique.mockResolvedValue({
      id: 'snap-1',
      data: { hero_slides: [] },
    });
    homepagePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      publishedAt: new Date('2026-08-22T00:00:00.000Z'),
    });

    await service.restoreSnapshot('snap-1');

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'home',
    });
  });

  it('does not emit content.published when the snapshot does not exist (restore never starts)', async () => {
    const { service, homepagePublishedSnapshot, events } = buildService();
    homepagePublishedSnapshot.findUnique.mockResolvedValue(null);

    await expect(service.restoreSnapshot('missing')).rejects.toThrow(
      ApiException,
    );

    expect(events.emit).not.toHaveBeenCalled();
  });
});

function stubHeroSlideRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'slide-1',
    desktopImage: null,
    mobileImage: null,
    eyebrowText: 'Export',
    heading: 'Coconut Export',
    subheading: 'Since 2010',
    description: null,
    button1Text: null,
    button1Link: null,
    button1Enabled: false,
    button1Style: 'primary',
    button2Text: null,
    button2Link: null,
    button2Enabled: false,
    button2Style: 'secondary',
    textAlignment: 'left',
    overlayOpacity: 40,
    order: 0,
    enabled: true,
    publishDate: null,
    translations: null,
    ...overrides,
  };
}

describe('HomepageService.updateHeroSlide — translation preservation (Phase 5D)', () => {
  it('persists a translations object spanning multiple locales unmodified — editing one locale must not drop the others', async () => {
    const { service, heroSlide } = buildService();
    heroSlide.findUnique.mockResolvedValue({ id: 'slide-1' }); // assertHeroSlideExists
    const translationsWithAllLocales = {
      id: { heading: 'Ekspor Kelapa' },
      zh: { heading: '椰子出口' },
      th: { heading: 'การส่งออกมะพร้าว' },
      vi: { heading: 'Xuất khẩu dừa' },
    };
    heroSlide.update.mockResolvedValue(stubHeroSlideRow());

    await service.updateHeroSlide('slide-1', {
      translations: translationsWithAllLocales,
    });

    const args = heroSlide.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(translationsWithAllLocales);
    expect(args[0].data.translations.id).toEqual({ heading: 'Ekspor Kelapa' });
    expect(args[0].data.translations.zh).toEqual({ heading: '椰子出口' });
    expect(args[0].data.translations.th).toEqual({
      heading: 'การส่งออกมะพร้าว',
    });
  });

  it('does not touch the translations column at all when the caller omits it from the update', async () => {
    const { service, heroSlide } = buildService();
    heroSlide.findUnique.mockResolvedValue({ id: 'slide-1' });
    heroSlide.update.mockResolvedValue(stubHeroSlideRow());

    await service.updateHeroSlide('slide-1', { heading: 'Renamed' });

    const args = heroSlide.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(args[0].data.translations).toBeUndefined();
  });
});

function stubAboutPreviewRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'preview-1',
    label: 'About PPN',
    heading: 'Reliable Coconut Exports',
    paragraph1: 'Paragraph one.',
    paragraph2: 'Paragraph two.',
    paragraph3: 'Paragraph three.',
    ctaText: 'Learn More',
    ctaLink: '/about',
    videoSource: 'none',
    videoUrl: null,
    videoMedia: null,
    videoThumbnail: null,
    enabled: true,
    translations: null,
    ...overrides,
  };
}

// Phase 5E-B: the Admin's LocaleTabs editors merge the full six-locale `translations` object
// client-side before every save (see apps/web/.../AboutPreviewEditor.tsx `handleUpdateTranslation`),
// identical to the Phase 5D/5E-A contract — these tests guard the service half of that contract
// for a second, independently-owned Homepage singleton (About Company Preview).
describe('HomepageService.updateAboutPreview — translation preservation (Phase 5E-B)', () => {
  it('a TH-only edit persists EN, ID, ZH, HI, and VI content unchanged', async () => {
    const { service, homepageAboutPreview } = buildService();
    homepageAboutPreview.findFirst.mockResolvedValue(stubAboutPreviewRow());
    const mergedAfterThEdit = {
      id: { heading: 'Ekspor Kelapa Terpercaya' },
      zh: { heading: '可靠的椰子出口' },
      hi: { heading: 'विश्वसनीय नारियल निर्यात' },
      vi: { heading: 'Xuất khẩu dừa đáng tin cậy' },
      th: { heading: 'การส่งออกมะพร้าวที่เชื่อถือได้ (แก้ไขแล้ว)' },
    };
    homepageAboutPreview.update.mockResolvedValue(stubAboutPreviewRow());

    await service.updateAboutPreview({ translations: mergedAfterThEdit });

    const args = homepageAboutPreview.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({
      heading: 'Ekspor Kelapa Terpercaya',
    });
    expect(args[0].data.translations.zh).toEqual({ heading: '可靠的椰子出口' });
    expect(args[0].data.translations.hi).toEqual({
      heading: 'विश्वसनीय नारियल निर्यात',
    });
    expect(args[0].data.translations.vi).toEqual({
      heading: 'Xuất khẩu dừa đáng tin cậy',
    });
  });

  it('an ID-only edit persists ZH, TH, HI, and VI unchanged', async () => {
    const { service, homepageAboutPreview } = buildService();
    homepageAboutPreview.findFirst.mockResolvedValue(stubAboutPreviewRow());
    const mergedAfterIdEdit = {
      id: { heading: 'Ekspor Kelapa Terpercaya (diedit)' },
      zh: { heading: '可靠的椰子出口' },
      th: { heading: 'การส่งออกมะพร้าวที่เชื่อถือได้' },
      hi: { heading: 'विश्वसनीय नारियल निर्यात' },
      vi: { heading: 'Xuất khẩu dừa đáng tin cậy' },
    };
    homepageAboutPreview.update.mockResolvedValue(stubAboutPreviewRow());

    await service.updateAboutPreview({ translations: mergedAfterIdEdit });

    const args = homepageAboutPreview.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterIdEdit);
    expect(args[0].data.translations.zh).toEqual({ heading: '可靠的椰子出口' });
    expect(args[0].data.translations.th).toEqual({
      heading: 'การส่งออกมะพร้าวที่เชื่อถือได้',
    });
    expect(args[0].data.translations.hi).toEqual({
      heading: 'विश्वसनीय नारियल निर्यात',
    });
    expect(args[0].data.translations.vi).toEqual({
      heading: 'Xuất khẩu dừa đáng tin cậy',
    });
  });

  it('does not touch the translations column when the caller omits it from the patch', async () => {
    const { service, homepageAboutPreview } = buildService();
    homepageAboutPreview.findFirst.mockResolvedValue(stubAboutPreviewRow());
    homepageAboutPreview.update.mockResolvedValue(stubAboutPreviewRow());

    await service.updateAboutPreview({ heading: 'Renamed' });

    const args = homepageAboutPreview.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(args[0].data.translations).toBeUndefined();
  });

  it('leaves non-translatable fields (cta_link, video settings, enabled) untouched by a translation-only update', async () => {
    const { service, homepageAboutPreview } = buildService();
    homepageAboutPreview.findFirst.mockResolvedValue(stubAboutPreviewRow());
    homepageAboutPreview.update.mockResolvedValue(stubAboutPreviewRow());

    await service.updateAboutPreview({
      translations: { th: { heading: 'ทดสอบ' } },
    });

    const args = homepageAboutPreview.update.mock.calls[0] as [
      {
        data: {
          ctaLink: unknown;
          videoSource: unknown;
          enabled: unknown;
        };
      },
    ];
    expect(args[0].data.ctaLink).toBeUndefined();
    expect(args[0].data.videoSource).toBeUndefined();
    expect(args[0].data.enabled).toBeUndefined();
  });
});

// Phase 5F-P0.3-A — the Phase 5D/5E-B tests above only prove the service round-trips whatever
// complete object the client pre-merged; they never exercise a row that already has *different*
// locale data sitting in the database independent of what the test sends. These simulate a
// genuinely partial payload — one locale, sometimes one field — against a row whose `translations`
// already holds other locales/fields, proving the server itself (not just editor-side convention)
// now preserves them, for every one of Homepage's 10 translation-bearing update paths.
function stubExistingTranslations(overrides: Record<string, unknown> = {}) {
  return {
    id: { title: 'Judul Indonesia', description: 'Deskripsi Indonesia' },
    zh: { title: '标题', description: '描述' },
    th: { title: 'หัวข้อ', description: 'คำอธิบาย' },
    hi: { title: 'शीर्षक', description: 'विवरण' },
    vi: { title: 'Tiêu đề', description: 'Mô tả' },
    ...overrides,
  };
}

describe('HomepageService — partial-payload merge safety against saved data (Phase 5F-P0.3-A)', () => {
  it('updateHeroSlide: an EN-only, single-field edit preserves every other locale and every other EN field already saved', async () => {
    const { service, heroSlide } = buildService();
    heroSlide.findUnique.mockResolvedValue({
      id: 'slide-1',
      translations: stubExistingTranslations({
        en: { title: 'Old English', description: 'Keep this' },
      }),
    });
    heroSlide.update.mockResolvedValue(stubHeroSlideRow());

    await service.updateHeroSlide('slide-1', {
      translations: { en: { title: 'New English' } },
    });

    const [call] = heroSlide.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      title: 'New English',
      description: 'Keep this',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  function stubPartnerLogoRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'logo-1',
      logo: {
        id: 'media-1',
        fileUrl: 'https://example.com/logo.png',
        fileType: 'image',
        altText: null,
        width: 100,
        height: 100,
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      partnerName: 'Partner',
      description: null,
      websiteUrl: null,
      openInNewTab: true,
      altText: null,
      category: 'Other',
      order: 0,
      enabled: true,
      featured: true,
      translations: null,
      ...overrides,
    };
  }

  it('updatePartnerLogo: a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, partnerLogo } = buildService();
    partnerLogo.findUnique.mockResolvedValue({
      id: 'logo-1',
      translations: stubExistingTranslations(),
    });
    partnerLogo.update.mockResolvedValue(stubPartnerLogoRow());

    await service.updatePartnerLogo('logo-1', {
      translations: { en: { title: 'New Logo Title' } },
    });

    const [call] = partnerLogo.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ title: 'New Logo Title' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  function stubShippingPartnerRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'partner-1',
      logo: {
        id: 'media-1',
        fileUrl: 'https://example.com/logo.png',
        fileType: 'image',
        altText: null,
        width: 100,
        height: 100,
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      partnerName: 'Partner',
      relationshipType: 'carrier',
      description: null,
      websiteUrl: null,
      openInNewTab: true,
      altText: null,
      order: 0,
      enabled: true,
      featured: true,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      translations: null,
      ...overrides,
    };
  }

  it('updateShippingPartner: a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, shippingPartner } = buildService();
    shippingPartner.findUnique.mockResolvedValue({
      id: 'partner-1',
      translations: stubExistingTranslations(),
    });
    shippingPartner.update.mockResolvedValue(stubShippingPartnerRow());

    await service.updateShippingPartner('partner-1', {
      translations: { en: { title: 'New Partner Title' } },
    });

    const [call] = shippingPartner.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ title: 'New Partner Title' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateAboutPreview: a single-locale partial payload against a row with saved data preserves every other locale', async () => {
    const { service, homepageAboutPreview } = buildService();
    homepageAboutPreview.findFirst.mockResolvedValue(
      stubAboutPreviewRow({ translations: stubExistingTranslations() }),
    );
    homepageAboutPreview.update.mockResolvedValue(stubAboutPreviewRow());

    await service.updateAboutPreview({
      translations: { en: { title: 'New About Title' } },
    });

    const [call] = homepageAboutPreview.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ title: 'New About Title' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  function stubHighlightRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'highlight-1',
      icon: 'quality',
      title: 'Highlight',
      description: null,
      order: 0,
      enabled: true,
      translations: null,
      ...overrides,
    };
  }

  it('updateHighlight: a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, homepageHighlight } = buildService();
    homepageHighlight.findUnique.mockResolvedValue({
      id: 'highlight-1',
      translations: stubExistingTranslations(),
    });
    homepageHighlight.update.mockResolvedValue(stubHighlightRow());

    await service.updateHighlight('highlight-1', {
      translations: { en: { title: 'New Highlight Title' } },
    });

    const [call] = homepageHighlight.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      title: 'New Highlight Title',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updatePartnersSection: a single-locale partial payload against a saved row preserves every other locale', async () => {
    const { service, homepagePartnersSection } = buildService();
    homepagePartnersSection.findFirst.mockResolvedValue({
      id: 'section-1',
      translations: stubExistingTranslations(),
    });
    homepagePartnersSection.update.mockResolvedValue({
      id: 'section-1',
      title: null,
      subtitle: null,
      marqueeDurationSeconds: 30,
      enabled: true,
      translations: null,
    });

    await service.updatePartnersSection({
      translations: { en: { title: 'New Partners Title' } },
    });

    const [call] = homepagePartnersSection.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ title: 'New Partners Title' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateShippingSection: a single-locale partial payload against a saved row preserves every other locale', async () => {
    const { service, homepageShippingSection } = buildService();
    homepageShippingSection.findFirst.mockResolvedValue({
      id: 'section-1',
      translations: stubExistingTranslations(),
    });
    homepageShippingSection.update.mockResolvedValue({
      id: 'section-1',
      title: null,
      subtitle: null,
      marqueeDurationSeconds: 30,
      showPartnerName: true,
      showRelationshipType: true,
      enabled: true,
      translations: null,
    });

    await service.updateShippingSection({
      translations: { en: { title: 'New Shipping Title' } },
    });

    const [call] = homepageShippingSection.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ title: 'New Shipping Title' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  function stubWhyChooseUsRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'item-1',
      icon: 'quality',
      title: 'Item',
      order: 0,
      enabled: true,
      featured: true,
      translations: null,
      ...overrides,
    };
  }

  it('updateWhyChooseUs: a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, homepageWhyChooseUs } = buildService();
    homepageWhyChooseUs.findUnique.mockResolvedValue({
      id: 'item-1',
      translations: stubExistingTranslations(),
    });
    homepageWhyChooseUs.update.mockResolvedValue(stubWhyChooseUsRow());

    await service.updateWhyChooseUs('item-1', {
      translations: { en: { title: 'New Why Choose Us Title' } },
    });

    const [call] = homepageWhyChooseUs.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      title: 'New Why Choose Us Title',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  function stubExportDestinationRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'dest-1',
      countryCode: 'ID',
      countryCodeAlpha3: 'IDN',
      countryName: 'Indonesia',
      exportStatus: 'active_destination',
      region: null,
      description: null,
      exportVolume: null,
      exportFrequency: null,
      destinationPort: null,
      products: [],
      order: 0,
      enabled: true,
      featured: false,
      showInCompanyProfile: false,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      translations: null,
      ...overrides,
    };
  }

  it('updateExportDestination: a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, exportDestination } = buildService();
    exportDestination.findUnique.mockResolvedValue({
      id: 'dest-1',
      translations: stubExistingTranslations(),
    });
    exportDestination.update.mockResolvedValue(stubExportDestinationRow());

    await service.updateExportDestination('dest-1', {
      translations: { en: { title: 'New Destination Title' } },
    });

    const [call] = exportDestination.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      title: 'New Destination Title',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateExportReachSection: a single-locale partial payload against a saved row preserves every other locale', async () => {
    const { service, homepageExportReach } = buildService();
    homepageExportReach.findFirst.mockResolvedValue({
      id: 'reach-1',
      translations: stubExistingTranslations(),
    });
    homepageExportReach.update.mockResolvedValue({
      id: 'reach-1',
      heading: null,
      subtitle: null,
      enabled: true,
      translations: null,
    });

    await service.updateExportReachSection({
      translations: { en: { title: 'New Export Reach Title' } },
    });

    const [call] = homepageExportReach.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      title: 'New Export Reach Title',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });
});
