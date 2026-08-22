import type { EventEmitter2 } from '@nestjs/event-emitter';
import { resolveAboutCompanySectionStatus } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { AboutCompanyService } from './about-company.service';
import type { MediaService } from '../../media/media.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('AboutCompanyService.getPublishedAboutCompany', () => {
  function buildService(latestSnapshot: unknown) {
    // Every draft-table delegate is a spy that fails the test if it is touched — the point of
    // these cases is exactly that the public payload must never be assembled from drafts.
    const draftDelegates = {
      aboutCompanyProfile: { findFirst: jest.fn(), create: jest.fn() },
      aboutCompanyFact: { findMany: jest.fn() },
      exportDestination: { findMany: jest.fn() },
      teamMember: { findMany: jest.fn() },
      aboutCompanyTeamSection: { findFirst: jest.fn(), create: jest.fn() },
      whatWeDoItem: { findMany: jest.fn() },
      legalCertificateDocument: { findMany: jest.fn() },
      factoryProfile: { findFirst: jest.fn(), create: jest.fn() },
      aboutCompanySettings: { findFirst: jest.fn(), create: jest.fn() },
      aboutCompanySectionConfig: { findMany: jest.fn(), count: jest.fn() },
    };
    const prisma = {
      ...draftDelegates,
      aboutCompanyPublishedSnapshot: {
        findFirst: jest.fn().mockResolvedValue(latestSnapshot),
      },
    };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        { emit: jest.fn() } as unknown as EventEmitter2,
      ),
      draftDelegates,
    };
  }

  // Regression guard: this used to fall back to the live draft tables, which put unpublished
  // Admin edits straight onto the public /about page before anyone pressed Publish.
  it('returns an empty, hidden payload when nothing has been published yet', async () => {
    const { service } = buildService(null);

    const payload = await service.getPublishedAboutCompany();

    expect(payload.settings.visible).toBe(false);
    expect(payload.profile.headline).toBe('');
    expect(payload.profile.main_description).toBe('');
    expect(payload.team_members).toEqual([]);
    expect(payload.what_we_do_items).toEqual([]);
    expect(payload.legal_documents).toEqual([]);
    expect(payload.factory.gallery).toEqual([]);
    expect(payload.section_config).toEqual([]);
    expect(payload.facts).toEqual([]);
    expect(payload.export_destinations).toEqual([]);
    expect(payload.team_members).toEqual([]);
    expect(payload.team_section.heading).toBe('');
    expect(payload.team_section.show_counter).toBe(false);
    // Every storytelling block must also be off, so an unpublished profile cannot render as a
    // set of empty headings.
    expect(payload.profile.story_visible).toBe(false);
    expect(payload.profile.scope_visible).toBe(false);
    expect(payload.profile.facts_visible).toBe(false);
    expect(payload.profile.export_visible).toBe(false);
    expect(payload.profile.legal_visible).toBe(false);
    expect(payload.profile.closing_visible).toBe(false);
  });

  it('never reads a draft table while no snapshot exists', async () => {
    const { service, draftDelegates } = buildService(null);

    await service.getPublishedAboutCompany();

    for (const delegate of Object.values(draftDelegates)) {
      for (const method of Object.values(delegate)) {
        expect(method).not.toHaveBeenCalled();
      }
    }
  });
});

describe('AboutCompanyService.restoreSnapshot', () => {
  function buildRestoreService() {
    const aboutCompanyPublishedSnapshot = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
    };
    const prisma = {
      aboutCompanyPublishedSnapshot,
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const events = { emit: jest.fn() };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        events as unknown as EventEmitter2,
      ),
      aboutCompanyPublishedSnapshot,
      events,
    };
  }

  it('emits content.published with source="about_company" after the restore transaction commits', async () => {
    const { service, aboutCompanyPublishedSnapshot, events } =
      buildRestoreService();
    aboutCompanyPublishedSnapshot.findUnique.mockResolvedValue({
      id: 'snap-1',
      data: {},
    });
    aboutCompanyPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      publishedAt: new Date('2026-08-22T00:00:00.000Z'),
    });

    await service.restoreSnapshot('snap-1');

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'about_company',
    });
  });

  it('does not emit content.published when the snapshot does not exist (restore never starts)', async () => {
    const { service, aboutCompanyPublishedSnapshot, events } =
      buildRestoreService();
    aboutCompanyPublishedSnapshot.findUnique.mockResolvedValue(null);

    await expect(service.restoreSnapshot('missing')).rejects.toThrow(
      ApiException,
    );

    expect(events.emit).not.toHaveBeenCalled();
  });
});

function stubProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    headline: 'CV. Putri Palma Nusantara',
    shortDescription: '',
    mainDescription: '',
    vision: '',
    mission: '',
    companyOverview: '',
    mainImage: null,
    storyImage: null,
    gallery: [],
    eyebrow: 'Who We Are',
    subheading: '',
    ctaLabel: null,
    ctaHref: null,
    youtubeVideoUrl: null,
    socialLabel: 'Connect With PPN',
    socialVisible: true,
    storyLabel: '',
    storyHeading: '',
    storyDescription: '',
    storySecondaryDescription: '',
    storyVisible: true,
    scopeLabel: '',
    scopeHeading: '',
    scopeDescription: '',
    scopeVisible: false,
    factsLabel: '',
    factsHeading: '',
    factsVisible: true,
    exportLabel: '',
    exportHeading: '',
    exportDescription: '',
    exportVisible: true,
    legalLabel: '',
    legalHeading: '',
    businessType: '',
    registeredAddress: '',
    businessIdNumber: '',
    establishedYear: '',
    legalVisible: true,
    closingLabel: '',
    closingHeading: '',
    closingDescription: '',
    closingCtaLabel: null,
    closingCtaHref: null,
    closingVisible: true,
    translations: null,
    ...overrides,
  };
}

// Phase 5E-A: the Admin's LocaleTabs editors merge the full six-locale `translations` object
// client-side before every save (see apps/web/.../ProfileBlockEditors.tsx `withTranslation`);
// these tests guard the service half of that contract — a save must persist every locale key
// it was given untouched, never silently dropping the ones the Admin wasn't actively editing.
describe('AboutCompanyService.updateProfile — translation preservation (Phase 5E-A)', () => {
  function buildProfileService() {
    const aboutCompanyProfile = {
      findFirst: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const prisma = { aboutCompanyProfile };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        { emit: jest.fn() } as unknown as EventEmitter2,
      ),
      aboutCompanyProfile,
    };
  }

  it('a TH-only edit persists EN, ID, ZH, HI, and VI content unchanged', async () => {
    const { service, aboutCompanyProfile } = buildProfileService();
    aboutCompanyProfile.findFirst.mockResolvedValue(stubProfileRow());
    // Simulates what the Admin UI sends: it read the existing translations, changed only `th`,
    // and spread every other locale back in unmodified — id/zh/hi/vi below must reach Prisma
    // exactly as they already were.
    const mergedAfterThEdit = {
      id: { eyebrow: 'Siapa Kami' },
      zh: { eyebrow: '我们是谁' },
      hi: { eyebrow: 'हम कौन हैं' },
      vi: { eyebrow: 'Chúng tôi là ai' },
      th: { eyebrow: 'เราคือใคร (แก้ไขแล้ว)' },
    };
    aboutCompanyProfile.update.mockResolvedValue(stubProfileRow());

    await service.updateProfile({ translations: mergedAfterThEdit });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({ eyebrow: 'Siapa Kami' });
    expect(args[0].data.translations.zh).toEqual({ eyebrow: '我们是谁' });
    expect(args[0].data.translations.hi).toEqual({ eyebrow: 'हम कौन हैं' });
    expect(args[0].data.translations.vi).toEqual({
      eyebrow: 'Chúng tôi là ai',
    });
  });

  it('an ID-only edit persists EN(source columns untouched), ZH, TH, HI, and VI unchanged', async () => {
    const { service, aboutCompanyProfile } = buildProfileService();
    aboutCompanyProfile.findFirst.mockResolvedValue(stubProfileRow());
    const mergedAfterIdEdit = {
      id: { eyebrow: 'Siapa Kami (diedit)' },
      zh: { eyebrow: '我们是谁' },
      th: { eyebrow: 'เราคือใคร' },
      hi: { eyebrow: 'हम कौन हैं' },
      vi: { eyebrow: 'Chúng tôi là ai' },
    };
    aboutCompanyProfile.update.mockResolvedValue(stubProfileRow());

    await service.updateProfile({
      // The Admin's English-tab fields are untouched in this scenario.
      headline: 'CV. Putri Palma Nusantara',
      translations: mergedAfterIdEdit,
    });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      {
        data: {
          headline: string;
          translations: Record<string, Record<string, string>>;
        };
      },
    ];
    expect(args[0].data.headline).toBe('CV. Putri Palma Nusantara');
    expect(args[0].data.translations).toEqual(mergedAfterIdEdit);
    expect(args[0].data.translations.zh).toEqual({ eyebrow: '我们是谁' });
    expect(args[0].data.translations.th).toEqual({ eyebrow: 'เราคือใคร' });
    expect(args[0].data.translations.hi).toEqual({ eyebrow: 'हम कौन हैं' });
    expect(args[0].data.translations.vi).toEqual({
      eyebrow: 'Chúng tôi là ai',
    });
  });

  it('does not touch the translations column when the caller omits it from the patch', async () => {
    const { service, aboutCompanyProfile } = buildProfileService();
    aboutCompanyProfile.findFirst.mockResolvedValue(stubProfileRow());
    aboutCompanyProfile.update.mockResolvedValue(stubProfileRow());

    await service.updateProfile({ headline: 'Renamed' });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(args[0].data.translations).toBeUndefined();
  });
});

describe('AboutCompanyService.updateFact — translation preservation (Phase 5E-A)', () => {
  function buildFactService() {
    const aboutCompanyFact = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const prisma = { aboutCompanyFact };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        { emit: jest.fn() } as unknown as EventEmitter2,
      ),
      aboutCompanyFact,
    };
  }

  it('a TH-only edit on a repeatable fact row persists the other five locales unchanged', async () => {
    const { service, aboutCompanyFact } = buildFactService();
    aboutCompanyFact.findUnique.mockResolvedValue({ id: 'fact-1' }); // assertExists
    const mergedAfterThEdit = {
      id: { value: 'Palu, Sulawesi Tengah' },
      zh: { value: '帕卢，中苏拉威西' },
      hi: { value: 'पालू, मध्य सुलावेसी' },
      vi: { value: 'Palu, Trung Sulawesi' },
      th: { value: 'ปาลู สุลาเวสีกลาง (แก้ไข)' },
    };
    aboutCompanyFact.update.mockResolvedValue({
      id: 'fact-1',
      label: 'Location',
      value: 'Palu, Central Sulawesi',
      icon: null,
      order: 0,
      active: true,
      translations: mergedAfterThEdit,
    });

    await service.updateFact('fact-1', {
      translations: mergedAfterThEdit,
    });

    const args = aboutCompanyFact.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({
      value: 'Palu, Sulawesi Tengah',
    });
    expect(args[0].data.translations.zh).toEqual({
      value: '帕卢，中苏拉威西',
    });
    expect(args[0].data.translations.hi).toEqual({
      value: 'पालू, मध्य सुलावेसी',
    });
    expect(args[0].data.translations.vi).toEqual({
      value: 'Palu, Trung Sulawesi',
    });
  });
});

describe('resolveAboutCompanySectionStatus', () => {
  const publishedAt = '2026-08-12T00:00:00.000Z';

  it('reports Hidden regardless of draft state when the section is not visible', () => {
    expect(
      resolveAboutCompanySectionStatus(
        { visible: false, has_unpublished_changes: false },
        publishedAt,
      ),
    ).toBe('hidden');
    expect(
      resolveAboutCompanySectionStatus(
        { visible: false, has_unpublished_changes: true },
        publishedAt,
      ),
    ).toBe('hidden');
  });

  it('reports Draft when the page has never been published', () => {
    expect(
      resolveAboutCompanySectionStatus(
        { visible: true, has_unpublished_changes: false },
        null,
      ),
    ).toBe('draft');
  });

  it('reports Draft when the section changed after the last publish', () => {
    expect(
      resolveAboutCompanySectionStatus(
        { visible: true, has_unpublished_changes: true },
        publishedAt,
      ),
    ).toBe('draft');
  });

  it('reports Published only when visible, published, and unchanged since', () => {
    expect(
      resolveAboutCompanySectionStatus(
        { visible: true, has_unpublished_changes: false },
        publishedAt,
      ),
    ).toBe('published');
  });
});
