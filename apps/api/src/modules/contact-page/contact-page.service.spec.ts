import { ContactPageService } from './contact-page.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';

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
    upsert: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const contactLocation = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    updateMany: jest
      .fn<Promise<unknown>, unknown[]>()
      .mockResolvedValue({ count: 0 }),
  };
  const contactSocialLink = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
  };
  const contactPagePublishedSnapshot = {
    upsert: jest.fn<Promise<unknown>, unknown[]>(),
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
    events,
  };
}

// P0.4-C1 — an unpublish is also a change to what's publicly visible, so AI knowledge must
// resync to drop Contact too, same as publish() already does.
describe('ContactPageService.unpublish', () => {
  it('sets is_published=false, same as before', async () => {
    const { service, contactPagePublishedSnapshot } = buildService();
    contactPagePublishedSnapshot.upsert.mockResolvedValue({
      id: 'snap-1',
      isPublished: true,
      publishedAt: new Date('2026-08-21T00:00:00.000Z'),
    });
    contactPagePublishedSnapshot.update.mockResolvedValue({
      isPublished: false,
      publishedAt: new Date('2026-08-21T00:00:00.000Z'),
    });

    const result = await service.unpublish();

    expect(result).toEqual({
      is_published: false,
      published_at: '2026-08-21T00:00:00.000Z',
    });
    const [call] = contactPagePublishedSnapshot.update.mock.calls;
    expect(call[0]).toEqual({
      where: { id: 'snap-1' },
      data: { isPublished: false },
    });
  });

  it('emits CONTENT_PUBLISHED_EVENT with source="contact", matching the publish() event convention', async () => {
    const { service, contactPagePublishedSnapshot, events } = buildService();
    contactPagePublishedSnapshot.upsert.mockResolvedValue({
      id: 'snap-1',
      isPublished: true,
      publishedAt: new Date(),
    });
    contactPagePublishedSnapshot.update.mockResolvedValue({
      isPublished: false,
      publishedAt: new Date(),
    });

    await service.unpublish();

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'contact',
    });
  });
});

// Phase P0.3-B3-B — `updateSettings()` now merges `translations` via `mergeTranslations()`
// (the same helper every other translation-bearing module's update path uses), instead of
// leaving the column untouched entirely (it wasn't even a DTO field before this phase). These
// prove a single-locale partial payload against a row that already has other locales saved
// cannot erase them.
describe('ContactPageService.updateSettings — translation merge safety (Phase P0.3-B3-B)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, contactPageSettings } = buildService();
    contactPageSettings.upsert.mockResolvedValue(
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
    contactPageSettings.upsert.mockResolvedValue(
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
    contactPageSettings.upsert.mockResolvedValue(
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
    contactPageSettings.upsert.mockResolvedValue(
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
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
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

// P0.4-D3 — updateSettings() previously wrote `main_map_location_id` straight into Prisma with
// no existence check; a stale/deleted id (picked in one tab while removed from Locations in
// another) fell through to an unhandled FK violation, surfacing as a raw 500 instead of a clean
// 400. `heroImageId` is deliberately untouched here — it's already Media-registry-protected.
describe('ContactPageService.updateSettings — main_map_location_id validation (P0.4-D3)', () => {
  it('throws INVALID_LOCATION (400) for a nonexistent main_map_location_id', async () => {
    const { service, contactPageSettings, contactLocation } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    contactLocation.findUnique.mockResolvedValue(null);

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.updateSettings({ main_map_location_id: 'missing-loc' });
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('INVALID_LOCATION');
    expect(thrown?.getStatus?.()).toBe(400);
    expect(contactPageSettings.update).not.toHaveBeenCalled();
  });

  it('a valid main_map_location_id saves successfully exactly as before', async () => {
    const { service, contactPageSettings, contactLocation } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    contactLocation.findUnique.mockResolvedValue({ id: 'loc-1' });
    contactPageSettings.update.mockResolvedValue(
      stubSettingsRow({ mainMapLocationId: 'loc-1' }),
    );

    const result = await service.updateSettings({
      main_map_location_id: 'loc-1',
    });

    expect(result.id).toBe('contact-1');
    expect(contactLocation.findUnique).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
    });
  });

  it('omitting main_map_location_id from the patch never triggers a location lookup', async () => {
    const { service, contactPageSettings, contactLocation } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    contactPageSettings.update.mockResolvedValue(stubSettingsRow());

    await service.updateSettings({ email: 'new@ppn.co.id' });

    expect(contactLocation.findUnique).not.toHaveBeenCalled();
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
    contactPageSettings.upsert.mockResolvedValue(
      stubSettingsRow({
        translations: { id: { heroHeading: 'Terhubung dengan Tim Kami' } },
      }),
    );

    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.upsert.mockImplementation(() =>
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
    contactPageSettings.upsert.mockResolvedValue(
      stubSettingsRow({
        translations: { zh: { heroHeading: '与我们的团队联系' } },
      }),
    );
    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.upsert.mockImplementation(() =>
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
    contactPagePublishedSnapshot.upsert.mockImplementation(() =>
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

    contactPageSettings.upsert.mockResolvedValueOnce(
      stubSettingsRow({
        translations: { id: { heroHeading: 'Terhubung dengan Tim Kami' } },
      }),
    );
    await service.publish();

    contactPageSettings.upsert.mockResolvedValueOnce(
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
    contactPagePublishedSnapshot.upsert.mockResolvedValue({
      id: 'snap-1',
      isPublished: false,
      data: null,
    });

    expect(await service.getPublished('id')).toBeNull();
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
  };
}

// Phase P0.3-B3-C — `updateLocation()` now merges `translations` (label only) the same way
// `updateSettings()` does since B3-B. `name`/`address`/`google_maps_url`/`phone`/`email` must
// never be touched by a translations-only patch.
describe('ContactPageService.updateLocation — translation merge safety (Phase P0.3-B3-C)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, contactLocation } = buildService();
    contactLocation.findUnique.mockResolvedValue(
      stubLocationRow({
        translations: {
          id: { label: 'Gudang Lama' },
          zh: { label: '旧仓库' },
        },
      }),
    );
    contactLocation.update.mockResolvedValue(stubLocationRow());

    await service.updateLocation('loc-1', {
      translations: { th: { label: 'คลังสินค้าใหม่' } },
    });

    const [call] = contactLocation.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ label: 'คลังสินค้าใหม่' });
    expect(call.data.translations.id).toEqual({ label: 'Gudang Lama' });
    expect(call.data.translations.zh).toEqual({ label: '旧仓库' });
  });

  it('does not touch translations when the caller omits it from the patch', async () => {
    const { service, contactLocation } = buildService();
    contactLocation.findUnique.mockResolvedValue(
      stubLocationRow({ translations: { id: { label: 'Gudang Lama' } } }),
    );
    contactLocation.update.mockResolvedValue(stubLocationRow());

    await service.updateLocation('loc-1', { name: 'Tolitoli Renamed' });

    const [call] = contactLocation.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('a legacy row with no translations object at all still updates successfully (backward compatibility)', async () => {
    const { service, contactLocation } = buildService();
    contactLocation.findUnique.mockResolvedValue(
      stubLocationRow({ translations: null }),
    );
    contactLocation.update.mockResolvedValue(stubLocationRow());

    await expect(
      service.updateLocation('loc-1', {
        translations: { id: { label: 'Gudang Baru' } },
      }),
    ).resolves.toBeDefined();

    const [call] = contactLocation.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ label: 'Gudang Baru' });
  });

  it('does not change name/address/google_maps_url/phone/email/order/active when only translations are patched', async () => {
    const { service, contactLocation } = buildService();
    contactLocation.findUnique.mockResolvedValue(stubLocationRow());
    contactLocation.update.mockResolvedValue(stubLocationRow());

    await service.updateLocation('loc-1', {
      translations: { id: { label: 'Gudang Baru' } },
    });

    const [call] = contactLocation.update.mock.calls[0] as [
      {
        data: {
          name: unknown;
          address: unknown;
          googleMapsUrl: unknown;
          phone: unknown;
          email: unknown;
          order: unknown;
          active: unknown;
        };
      },
    ];
    expect(call.data.name).toBeUndefined();
    expect(call.data.address).toBeUndefined();
    expect(call.data.googleMapsUrl).toBeUndefined();
    expect(call.data.phone).toBeUndefined();
    expect(call.data.email).toBeUndefined();
    expect(call.data.order).toBeUndefined();
    expect(call.data.active).toBeUndefined();
  });

  it('editing one location does not alter the translations sent for another location', async () => {
    const { service, contactLocation } = buildService();
    contactLocation.findUnique.mockResolvedValueOnce(
      stubLocationRow({
        id: 'loc-1',
        translations: { id: { label: 'Gudang Tolitoli' } },
      }),
    );
    contactLocation.update.mockResolvedValueOnce(stubLocationRow());
    await service.updateLocation('loc-1', {
      translations: { zh: { label: '多利多利仓库' } },
    });

    contactLocation.findUnique.mockResolvedValueOnce(
      stubLocationRow({
        id: 'loc-2',
        label: 'Palu Facility',
        translations: { id: { label: 'Fasilitas Palu Lama' } },
      }),
    );
    contactLocation.update.mockResolvedValueOnce(stubLocationRow());
    await service.updateLocation('loc-2', {
      translations: { th: { label: 'สิ่งอำนวยความสะดวกปาลู' } },
    });

    const [firstCall] = contactLocation.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    const [secondCall] = contactLocation.update.mock.calls[1] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(firstCall.data.translations.id).toEqual({
      label: 'Gudang Tolitoli',
    });
    expect(firstCall.data.translations.zh).toEqual({
      label: '多利多利仓库',
    });
    expect(secondCall.data.translations.id).toEqual({
      label: 'Fasilitas Palu Lama',
    });
    expect(secondCall.data.translations.th).toEqual({
      label: 'สิ่งอำนวยความสะดวกปาลู',
    });
  });
});

// Phase P0.3-B3-C — locations are embedded into the frozen snapshot exactly like settings; the
// most important regression here is the same draft/publish isolation guarantee the whole module
// is built around: a draft translation edit must never leak onto the public page before an
// explicit Publish, and republishing must carry every previously-saved locale forward.
describe('ContactPageService — publish → getPublished locale resolution for locations (Phase P0.3-B3-C)', () => {
  function wireSnapshot(
    contactPagePublishedSnapshot: ReturnType<
      typeof buildService
    >['contactPagePublishedSnapshot'],
  ) {
    let storedSnapshotData: unknown;
    contactPagePublishedSnapshot.upsert.mockImplementation(() =>
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
  }

  it('a translation saved to the draft location and then published resolves correctly per locale on the public read path', async () => {
    const {
      service,
      contactLocation,
      contactPageSettings,
      contactPagePublishedSnapshot,
    } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    wireSnapshot(contactPagePublishedSnapshot);
    contactLocation.findMany.mockResolvedValue([
      stubLocationRow({
        translations: { id: { label: 'Gudang Utama' } },
      }),
    ]);

    await service.publish();

    const idResult = await service.getPublished('id');
    const enResult = await service.getPublished('en');
    expect(idResult?.locations[0]?.label).toBe('Gudang Utama');
    expect(enResult?.locations[0]?.label).toBe('Main Warehouse');
  });

  it('draft location update does NOT leak into the public snapshot before Contact is republished', async () => {
    const {
      service,
      contactLocation,
      contactPageSettings,
      contactPagePublishedSnapshot,
    } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    wireSnapshot(contactPagePublishedSnapshot);

    // First publish — the draft has no Indonesian translation yet.
    contactLocation.findMany.mockResolvedValue([
      stubLocationRow({ translations: null }),
    ]);
    await service.publish();

    // Admin now edits the draft location's Indonesian label, but does NOT republish.
    contactLocation.findUnique.mockResolvedValue(
      stubLocationRow({ translations: null }),
    );
    contactLocation.update.mockResolvedValue(
      stubLocationRow({ translations: { id: { label: 'Gudang Baru' } } }),
    );
    await service.updateLocation('loc-1', {
      translations: { id: { label: 'Gudang Baru' } },
    });

    // Public read must still show the old, already-published label.
    const idResult = await service.getPublished('id');
    expect(idResult?.locations[0]?.label).toBe('Main Warehouse');
  });

  it('after Contact is republished, the newly translated label becomes public', async () => {
    const {
      service,
      contactLocation,
      contactPageSettings,
      contactPagePublishedSnapshot,
    } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    wireSnapshot(contactPagePublishedSnapshot);

    contactLocation.findMany.mockResolvedValueOnce([
      stubLocationRow({ translations: null }),
    ]);
    await service.publish();

    // Draft now has the translation (simulating the update above already having happened).
    contactLocation.findMany.mockResolvedValueOnce([
      stubLocationRow({ translations: { id: { label: 'Gudang Baru' } } }),
    ]);
    await service.publish();

    const idResult = await service.getPublished('id');
    expect(idResult?.locations[0]?.label).toBe('Gudang Baru');
  });

  it('re-publishing after adding a second locale carries every locale forward, not just the newest one', async () => {
    const {
      service,
      contactLocation,
      contactPageSettings,
      contactPagePublishedSnapshot,
    } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    wireSnapshot(contactPagePublishedSnapshot);

    contactLocation.findMany.mockResolvedValueOnce([
      stubLocationRow({ translations: { id: { label: 'Gudang Utama' } } }),
    ]);
    await service.publish();

    contactLocation.findMany.mockResolvedValueOnce([
      stubLocationRow({
        translations: {
          id: { label: 'Gudang Utama' },
          zh: { label: '主要仓库' },
        },
      }),
    ]);
    await service.publish();

    const idResult = await service.getPublished('id');
    const zhResult = await service.getPublished('zh');
    expect(idResult?.locations[0]?.label).toBe('Gudang Utama');
    expect(zhResult?.locations[0]?.label).toBe('主要仓库');
  });

  it('an old snapshot with no translations key on its location objects still renders the base label without error', async () => {
    const { service, contactPagePublishedSnapshot } = buildService();
    const legacyLocation = stubLocationRow();
    delete (legacyLocation as { translations?: unknown }).translations;
    contactPagePublishedSnapshot.upsert.mockResolvedValue({
      id: 'snap-1',
      isPublished: true,
      data: {
        settings: {},
        locations: [
          {
            id: 'loc-1',
            name: 'Tolitoli',
            location_type: 'head_office',
            label: 'Main Warehouse',
            address: 'Jl. Tolitoli No. 1',
            google_maps_url: 'https://maps.app.goo.gl/tolitoli',
            phone: null,
            email: null,
            order: 0,
            active: true,
            updated_at: '2026-01-01T00:00:00.000Z',
            // no `translations` key at all — simulates a pre-B3-C snapshot
          },
        ],
      },
    });

    const idResult = await service.getPublished('id');
    expect(idResult?.locations[0]?.label).toBe('Main Warehouse');
  });

  it('label translation never changes name/address/google_maps_url across locales on the public read path', async () => {
    const {
      service,
      contactLocation,
      contactPageSettings,
      contactPagePublishedSnapshot,
    } = buildService();
    contactPageSettings.upsert.mockResolvedValue(stubSettingsRow());
    wireSnapshot(contactPagePublishedSnapshot);
    contactLocation.findMany.mockResolvedValue([
      stubLocationRow({ translations: { id: { label: 'Gudang Utama' } } }),
    ]);
    await service.publish();

    const en = (await service.getPublished('en'))!.locations[0];
    const id = (await service.getPublished('id'))!.locations[0];
    expect(id.label).not.toBe(en.label);
    expect(id.name).toBe(en.name);
    expect(id.address).toBe(en.address);
    expect(id.google_maps_url).toBe(en.google_maps_url);
    expect(id.phone).toBe(en.phone);
    expect(id.email).toBe(en.email);
  });
});
