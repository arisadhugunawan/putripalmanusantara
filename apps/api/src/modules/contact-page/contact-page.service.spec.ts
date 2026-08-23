import { ContactPageService } from './contact-page.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';

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

function buildService() {
  const contactPageSettings = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const contactLocation = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
  };
  const contactSocialLink = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
  };
  const contactPagePublishedSnapshot = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const events = { emit: jest.fn() };
  const service = new ContactPageService(
    {
      contactPageSettings,
      contactLocation,
      contactSocialLink,
      contactPagePublishedSnapshot,
    } as unknown as PrismaService,
    events as unknown as EventEmitter2,
  );
  return {
    service,
    contactPageSettings,
    contactLocation,
    contactSocialLink,
    contactPagePublishedSnapshot,
  };
}

// Phase P0.3-B3-B — `updateSettings()` now merges `translations` via `mergeTranslations()`
// (the same helper every other translation-bearing module's update path uses), instead of
// leaving the column untouched entirely (it wasn't even a DTO field before this phase). These
// prove a single-locale partial payload against a row that already has other locales saved
// cannot erase them.
describe('ContactPageService.updateSettings — translation merge safety (Phase P0.3-B3-B)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({
        translations: {
          en: { heroEyebrow: 'Contact PPN' },
          zh: { heroEyebrow: '联系PPN' },
          th: { heroEyebrow: 'ติดต่อ PPN' },
          hi: { heroEyebrow: 'PPN से संपर्क करें' },
          vi: { heroEyebrow: 'Liên Hệ PPN' },
        },
      }),
    );
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await service.updateSettings({
      translations: { id: { heroEyebrow: 'Hubungi PPN' } },
    });

    const [call] = contactPageSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ heroEyebrow: 'Hubungi PPN' });
    expect(call.data.translations.en).toEqual({ heroEyebrow: 'Contact PPN' });
    expect(call.data.translations.zh).toEqual({ heroEyebrow: '联系PPN' });
    expect(call.data.translations.th).toEqual({ heroEyebrow: 'ติดต่อ PPN' });
    expect(call.data.translations.hi).toEqual({
      heroEyebrow: 'PPN से संपर्क करें',
    });
    expect(call.data.translations.vi).toEqual({ heroEyebrow: 'Liên Hệ PPN' });
  });

  it('updating one field within a locale preserves the other fields already saved for that same locale', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({
        translations: {
          id: { heroEyebrow: 'Hubungi lama', heroHeading: 'Judul lama' },
        },
      }),
    );
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await service.updateSettings({
      translations: { id: { heroEyebrow: 'Hubungi baru' } },
    });

    const [call] = contactPageSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      heroEyebrow: 'Hubungi baru',
      heroHeading: 'Judul lama',
    });
  });

  it('does not touch translations when the caller omits it from the patch', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({
        translations: { id: { heroEyebrow: 'Hubungi lama' } },
      }),
    );
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await service.updateSettings({ email: 'new@ppn.co.id' });

    const [call] = contactPageSettings.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('a legacy row with no translations object at all still updates successfully (backward compatibility)', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({ translations: null }),
    );
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await expect(
      service.updateSettings({
        translations: { id: { heroEyebrow: 'Hubungi baru' } },
      }),
    ).resolves.toBeDefined();

    const [call] = contactPageSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ heroEyebrow: 'Hubungi baru' });
  });

  it('does not change non-translatable fields (email, business hours, cta_*) when only translations are patched', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.findFirst.mockResolvedValue(stubSettingsRow());
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await service.updateSettings({
      translations: { id: { heroEyebrow: 'Hubungi baru' } },
    });

    const [call] = contactPageSettings.update.mock.calls[0] as [
      {
        data: {
          email: unknown;
          whatsappNumber: unknown;
          buyerCtaHeading: unknown;
          businessHoursOpenTime: unknown;
        };
      },
    ];
    expect(call.data.email).toBeUndefined();
    expect(call.data.whatsappNumber).toBeUndefined();
    expect(call.data.buyerCtaHeading).toBeUndefined();
    expect(call.data.businessHoursOpenTime).toBeUndefined();
  });
});

// Phase P0.3-B3-B — the most important regression: proves publishing a draft with a new
// translation actually carries that translation into the frozen snapshot, and that the public
// read path resolves it per-locale. This exact scenario is what the audit's snapshot-shape
// question turned on: before this phase, `getPublished()` had no `locale` parameter at all and
// `buildSnapshotPayload()`'s stored settings carried no `translations` field, so `/id/contact`
// could only ever show English — no code path existed to make it show anything else.
describe('ContactPageService — publish → getPublished locale resolution (Phase P0.3-B3-B)', () => {
  it('a translation saved to the draft and then published resolves correctly per locale on the public read path', async () => {
    const { service, contactPageSettings, contactPagePublishedSnapshot } =
      buildService();

    // Draft row already has an Indonesian hero translation (simulating: admin saved it).
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({
        translations: { id: { heroHeading: 'Terhubung dengan Tim Kami' } },
      }),
    );

    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: 'snap-1',
        isPublished: true,
        data: storedSnapshotData,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    contactPagePublishedSnapshot.update.mockImplementation(
      ({
        data,
      }: {
        data: { data: unknown; isPublished: boolean; publishedAt: Date };
      }) => {
        storedSnapshotData = data.data;
        return Promise.resolve({
          id: 'snap-1',
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
        });
      },
    );

    await service.publish();

    // Before the fix, this would still read "Connect With Our Team" (English) for "id" — there
    // was no `translations` field on the stored snapshot settings and no locale resolution on
    // the read path. After the fix, it must show the Indonesian translation.
    const idResult = await service.getPublished('id');
    expect(idResult?.settings.hero_heading).toBe('Terhubung dengan Tim Kami');

    // English is untouched.
    const enResult = await service.getPublished('en');
    expect(enResult?.settings.hero_heading).toBe('Connect With Our Team');
  });

  it('getPublished() defaults to English when called with no locale (preserves the AI content extractor call site)', async () => {
    const { service, contactPageSettings, contactPagePublishedSnapshot } =
      buildService();
    contactPageSettings.findFirst.mockResolvedValue(
      stubSettingsRow({
        translations: { zh: { heroHeading: '与我们的团队联系' } },
      }),
    );
    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: 'snap-1',
        isPublished: true,
        data: storedSnapshotData,
      }),
    );
    contactPagePublishedSnapshot.update.mockImplementation(
      ({
        data,
      }: {
        data: { data: unknown; isPublished: boolean; publishedAt: Date };
      }) => {
        storedSnapshotData = data.data;
        return Promise.resolve({
          id: 'snap-1',
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
        });
      },
    );

    await service.publish();

    const result = await service.getPublished();
    expect(result?.settings.hero_heading).toBe('Connect With Our Team');
  });

  it('re-publishing after adding a second locale carries every locale forward, not just the newest one', async () => {
    const { service, contactPageSettings, contactPagePublishedSnapshot } =
      buildService();
    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: 'snap-1',
        isPublished: true,
        data: storedSnapshotData,
      }),
    );
    contactPagePublishedSnapshot.update.mockImplementation(
      ({
        data,
      }: {
        data: { data: unknown; isPublished: boolean; publishedAt: Date };
      }) => {
        storedSnapshotData = data.data;
        return Promise.resolve({
          id: 'snap-1',
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
        });
      },
    );

    contactPageSettings.findFirst.mockResolvedValueOnce(
      stubSettingsRow({
        translations: { id: { heroHeading: 'Terhubung dengan Tim Kami' } },
      }),
    );
    await service.publish();

    contactPageSettings.findFirst.mockResolvedValueOnce(
      stubSettingsRow({
        translations: {
          id: { heroHeading: 'Terhubung dengan Tim Kami' },
          zh: { heroHeading: '与我们的团队联系' },
        },
      }),
    );
    await service.publish();

    const idResult = await service.getPublished('id');
    const zhResult = await service.getPublished('zh');
    expect(idResult?.settings.hero_heading).toBe('Terhubung dengan Tim Kami');
    expect(zhResult?.settings.hero_heading).toBe('与我们的团队联系');
  });

  it('returns null when nothing has been published, regardless of locale', async () => {
    const { service, contactPagePublishedSnapshot } = buildService();
    contactPagePublishedSnapshot.findFirst.mockResolvedValue({
      id: 'snap-1',
      isPublished: false,
      data: null,
    });

    expect(await service.getPublished('id')).toBeNull();
  });
});
