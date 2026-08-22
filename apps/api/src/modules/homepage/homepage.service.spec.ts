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
  const prisma = {
    homepagePublishedSnapshot,
    heroSlide,
    homepageAboutPreview,
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
