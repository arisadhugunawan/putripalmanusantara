import type { EventEmitter2 } from '@nestjs/event-emitter';
import { resolveAboutCompanySectionStatus } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { AboutCompanyService } from './about-company.service';
import type { AiTranslationService } from '../ai/ai-translation.service';
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
        {} as unknown as AiTranslationService,
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
        {} as unknown as AiTranslationService,
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
      upsert: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const prisma = { aboutCompanyProfile };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        { emit: jest.fn() } as unknown as EventEmitter2,
        {} as unknown as AiTranslationService,
      ),
      aboutCompanyProfile,
    };
  }

  it('a TH-only edit persists EN, ID, ZH, HI, and VI content unchanged', async () => {
    const { service, aboutCompanyProfile } = buildProfileService();
    aboutCompanyProfile.upsert.mockResolvedValue(stubProfileRow());
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
    aboutCompanyProfile.upsert.mockResolvedValue(stubProfileRow());
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
    aboutCompanyProfile.upsert.mockResolvedValue(stubProfileRow());
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
        {} as unknown as AiTranslationService,
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

// Phase 5F-P0.1 — stored-XSS hardening. mainDescription/companyOverview are edited via the same
// unsanitized-HTML-producing TipTap RichTextEditor as Article.content (CompanyProfileEditor.tsx)
// and already feed the AI content extractor (ai-content-extractor.service.ts) — these tests
// prove updateProfile() strips malicious markup before it reaches Prisma.
describe('AboutCompanyService.updateProfile — stored-XSS hardening (Phase 5F-P0.1)', () => {
  function buildService() {
    const aboutCompanyProfile = {
      upsert: jest
        .fn()
        .mockResolvedValue({ id: 'profile-1', translations: null }),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const prisma = { aboutCompanyProfile };
    return {
      service: new AboutCompanyService(
        prisma as unknown as PrismaService,
        {} as unknown as MediaService,
        { emit: jest.fn() } as unknown as EventEmitter2,
        {} as unknown as AiTranslationService,
      ),
      aboutCompanyProfile,
    };
  }

  it('strips a <script> payload from main_description before persisting', async () => {
    const { service, aboutCompanyProfile } = buildService();
    aboutCompanyProfile.update.mockResolvedValue({
      id: 'profile-1',
      gallery: [],
    });

    await service.updateProfile({
      main_description: '<p>Hello</p><script>alert(1)</script>',
    });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { mainDescription: string } },
    ];
    expect(args[0].data.mainDescription).not.toContain('<script');
    expect(args[0].data.mainDescription).not.toContain('alert(1)');
    expect(args[0].data.mainDescription).toContain('<p>Hello</p>');
  });

  it('strips an <img onerror> payload from company_overview before persisting', async () => {
    const { service, aboutCompanyProfile } = buildService();
    aboutCompanyProfile.update.mockResolvedValue({
      id: 'profile-1',
      gallery: [],
    });

    await service.updateProfile({
      company_overview: '<img src=x onerror=alert(1)><p>Overview</p>',
    });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { companyOverview: string } },
    ];
    expect(args[0].data.companyOverview).not.toContain('onerror');
    expect(args[0].data.companyOverview).not.toContain('alert(1)');
    expect(args[0].data.companyOverview).toContain('<p>Overview</p>');
  });

  it('strips a malicious payload from mainDescription/companyOverview in every locale of translations', async () => {
    const { service, aboutCompanyProfile } = buildService();
    aboutCompanyProfile.update.mockResolvedValue({
      id: 'profile-1',
      gallery: [],
    });

    await service.updateProfile({
      translations: {
        zh: {
          mainDescription: '<svg onload=alert(1)></svg><p>干净</p>',
          companyOverview:
            '<iframe src="javascript:alert(1)"></iframe><p>概述</p>',
        },
      },
    });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      {
        data: {
          translations: Record<string, Record<string, string>>;
        };
      },
    ];
    expect(args[0].data.translations.zh.mainDescription).not.toContain('<svg');
    expect(args[0].data.translations.zh.mainDescription).toContain(
      '<p>干净</p>',
    );
    expect(args[0].data.translations.zh.companyOverview).not.toContain(
      '<iframe',
    );
    expect(args[0].data.translations.zh.companyOverview).toContain(
      '<p>概述</p>',
    );
  });

  it('preserves legitimate formatting in main_description', async () => {
    const { service, aboutCompanyProfile } = buildService();
    aboutCompanyProfile.update.mockResolvedValue({
      id: 'profile-1',
      gallery: [],
    });

    await service.updateProfile({
      main_description:
        '<h2>About Us</h2><p><strong>Bold</strong> text</p><ul><li>Item</li></ul>',
    });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { mainDescription: string } },
    ];
    expect(args[0].data.mainDescription).toContain('<h2>About Us</h2>');
    expect(args[0].data.mainDescription).toContain('<strong>Bold</strong>');
    expect(args[0].data.mainDescription).toContain('<ul><li>Item</li></ul>');
  });

  it('leaves mainDescription/companyOverview untouched (undefined) when omitted from the patch', async () => {
    const { service, aboutCompanyProfile } = buildService();
    aboutCompanyProfile.update.mockResolvedValue({
      id: 'profile-1',
      gallery: [],
    });

    await service.updateProfile({ headline: 'New Headline' });

    const args = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { mainDescription: unknown; companyOverview: unknown } },
    ];
    expect(args[0].data.mainDescription).toBeUndefined();
    expect(args[0].data.companyOverview).toBeUndefined();
  });
});

// Phase 5F-P0.3-A — the Phase 5E-A tests above only prove the service round-trips whatever
// complete object the client pre-merged; the mocked rows they read back never carry *different*
// locale data than what the test itself sends. These simulate a genuinely partial payload
// against a row whose `translations` column already holds other locales/fields in the database,
// proving the server itself (not just Admin-editor convention) now preserves them. This module
// has 25 update paths sharing exactly two wiring shapes — the generic `assertExists<T>()` helper
// (used by every repeatable child row) and the `getOrCreateX()` singleton getter (used by every
// section/profile singleton) — so this suite exercises a representative sample of each shape,
// plus `updateProfile`'s combined merge+sanitize ordering, which is the highest-risk site in the
// file since it layers `sanitizeTranslationsRichText` on top of the merge.
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

describe('AboutCompanyService — partial-payload merge safety against saved data (Phase 5F-P0.3-A)', () => {
  it('updateProfile: an EN-only edit preserves every other locale already saved, through the merge+sanitize pipeline', async () => {
    const aboutCompanyProfile = {
      upsert: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { aboutCompanyProfile } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    aboutCompanyProfile.upsert.mockResolvedValue(
      stubProfileRow({ translations: stubExistingTranslations() }),
    );
    aboutCompanyProfile.update.mockResolvedValue(stubProfileRow());

    await service.updateProfile({
      translations: { en: { eyebrow: 'New English Eyebrow' } },
    });

    const [call] = aboutCompanyProfile.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({
      eyebrow: 'New English Eyebrow',
    });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateFact (generic assertExists-based repeatable row): a single-locale payload preserves every other locale already saved', async () => {
    const aboutCompanyFact = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { aboutCompanyFact } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    aboutCompanyFact.findUnique.mockResolvedValue({
      id: 'fact-1',
      translations: stubExistingTranslations(),
    });
    aboutCompanyFact.update.mockResolvedValue({
      id: 'fact-1',
      label: 'Location',
      value: 'Palu',
      icon: null,
      order: 0,
      active: true,
      translations: null,
    });

    await service.updateFact('fact-1', {
      translations: { en: { label: 'New English Label' } },
    });

    const [call] = aboutCompanyFact.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ label: 'New English Label' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateFacility (assertExists-based repeatable row, media-heavy DTO): preserves every other locale already saved', async () => {
    const facility = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { facility } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    facility.findUnique.mockResolvedValue({
      id: 'facility-1',
      translations: stubExistingTranslations(),
    });
    facility.update.mockResolvedValue({
      id: 'facility-1',
      name: 'Warehouse',
      description: '',
      facilityType: 'warehouse',
      location: '',
      status: 'operational',
      coverImage: null,
      gallery: [],
      order: 0,
      active: true,
      featured: false,
      translations: null,
    });

    await service.updateFacility('facility-1', {
      translations: { en: { name: 'New Warehouse Name' } },
    });

    const [call] = facility.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ name: 'New Warehouse Name' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateTeamSection (getOrCreate-based singleton): a single-locale payload against a saved row preserves every other locale', async () => {
    const aboutCompanyTeamSection = {
      upsert: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { aboutCompanyTeamSection } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    aboutCompanyTeamSection.upsert.mockResolvedValue({
      id: 'section-1',
      translations: stubExistingTranslations(),
    });
    aboutCompanyTeamSection.update.mockResolvedValue({
      id: 'section-1',
      eyebrow: null,
      heading: null,
      description: null,
      ctaLabel: null,
      ctaHref: null,
      showCounter: true,
      translations: null,
    });

    await service.updateTeamSection({
      translations: { en: { heading: 'New Team Heading' } },
    });

    const [call] = aboutCompanyTeamSection.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ heading: 'New Team Heading' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateMoqPaymentQuickCard: a single-locale payload preserves every other locale already saved', async () => {
    const moqPaymentQuickCard = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { moqPaymentQuickCard } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    moqPaymentQuickCard.findUnique.mockResolvedValue({
      id: 'card-1',
      translations: stubExistingTranslations(),
    });
    moqPaymentQuickCard.update.mockResolvedValue({
      id: 'card-1',
      label: 'MOQ',
      value: '1 container',
      icon: 'container',
      order: 0,
      active: true,
      translations: null,
    });

    await service.updateMoqPaymentQuickCard('card-1', {
      translations: { en: { label: 'New MOQ Label' } },
    });

    const [call] = moqPaymentQuickCard.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ label: 'New MOQ Label' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.zh).toEqual(stubExistingTranslations().zh);
    expect(call.data.translations.th).toEqual(stubExistingTranslations().th);
    expect(call.data.translations.hi).toEqual(stubExistingTranslations().hi);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });

  it('updateFacilitiesFaqSection (getOrCreate-based singleton): a single-locale payload preserves every other locale already saved', async () => {
    const aboutCompanyFacilitiesFaqSection = {
      upsert: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { aboutCompanyFacilitiesFaqSection } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    aboutCompanyFacilitiesFaqSection.upsert.mockResolvedValue({
      id: 'faq-section-1',
      translations: stubExistingTranslations(),
    });
    aboutCompanyFacilitiesFaqSection.update.mockResolvedValue({
      id: 'faq-section-1',
      eyebrow: null,
      heading: null,
      description: null,
      accordionMode: 'single',
      ctaTitle: null,
      ctaDescription: null,
      ctaPrimaryLabel: null,
      ctaPrimaryHref: null,
      ctaSecondaryLabel: null,
      ctaSecondaryHref: null,
      translations: null,
    });

    await service.updateFacilitiesFaqSection({
      translations: { en: { heading: 'New FAQ Heading' } },
    });

    const [call] = aboutCompanyFacilitiesFaqSection.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.en).toEqual({ heading: 'New FAQ Heading' });
    expect(call.data.translations.id).toEqual(stubExistingTranslations().id);
    expect(call.data.translations.vi).toEqual(stubExistingTranslations().vi);
  });
});

// Phase 5F-P0.3-A (final hardening) — duplicate* methods clone an entire row into a brand-new
// one; unlike update(), there is no partial payload to merge, so the fix here is simply "copy
// `source.translations` into the new row's `create()` call," matching the pattern Homepage's
// `duplicateHeroSlide`/`duplicatePartnerLogo`/`duplicateShippingPartner` already used correctly.
// These three About Company duplicate methods were found missing that one line entirely — a
// duplicate silently started from zero translations regardless of how many locales the source
// had filled in.
function stubSixLocaleTranslations(overrides: Record<string, unknown> = {}) {
  return {
    en: { title: 'English', description: 'English description' },
    id: { title: 'Indonesia', description: 'Deskripsi Indonesia' },
    zh: { title: '标题', description: '描述' },
    th: { title: 'หัวข้อ', description: 'คำอธิบาย' },
    hi: { title: 'शीर्षक', description: 'विवरण' },
    vi: { title: 'Tiêu đề', description: 'Mô tả' },
    ...overrides,
  };
}

describe('AboutCompanyService — duplicate* preserves the source translations (Phase 5F-P0.3-A final hardening)', () => {
  it('duplicateTeamMember: the new row carries the complete six-locale translations object', async () => {
    const teamMember = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { teamMember } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    const source = {
      id: 'member-1',
      name: 'Jane Doe',
      position: 'CEO',
      biography: '',
      responsibilities: '',
      department: null,
      photoId: null,
      linkedinUrl: null,
      email: null,
      phone: null,
      active: true,
      featured: false,
      translations: stubSixLocaleTranslations(),
    };
    teamMember.findUnique.mockResolvedValue(source);
    teamMember.count.mockResolvedValue(3);
    teamMember.create.mockResolvedValue({
      id: 'member-2',
      name: 'Jane Doe — Copy',
      translations: stubSixLocaleTranslations(),
    });

    await service.duplicateTeamMember('member-1');

    const [call] = teamMember.create.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual(stubSixLocaleTranslations());
    expect(Object.keys(call.data.translations)).toEqual([
      'en',
      'id',
      'zh',
      'th',
      'hi',
      'vi',
    ]);
    // The source row itself is never written to — only read once via findUnique.
    expect(teamMember.findUnique).toHaveBeenCalledTimes(1);
    expect(teamMember.update).not.toHaveBeenCalled();
  });

  it('duplicateWhatWeDoItem: the new row carries the complete six-locale translations object', async () => {
    const whatWeDoItem = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { whatWeDoItem } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    const source = {
      id: 'item-1',
      title: 'Export',
      shortDescription: '',
      detailedDescription: '',
      keyPoints: [],
      mediaId: null,
      productId: null,
      active: true,
      featured: false,
      translations: stubSixLocaleTranslations(),
    };
    whatWeDoItem.findUnique.mockResolvedValue(source);
    whatWeDoItem.count.mockResolvedValue(2);
    whatWeDoItem.create.mockResolvedValue({
      id: 'item-2',
      title: 'Export — Copy',
      translations: stubSixLocaleTranslations(),
    });

    await service.duplicateWhatWeDoItem('item-1');

    const [call] = whatWeDoItem.create.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual(stubSixLocaleTranslations());
    expect(Object.keys(call.data.translations)).toEqual([
      'en',
      'id',
      'zh',
      'th',
      'hi',
      'vi',
    ]);
    expect(whatWeDoItem.update).not.toHaveBeenCalled();
  });

  it('duplicateLegalDocument: the new row carries the complete six-locale translations object, and a new id, with verified reset to false', async () => {
    const legalCertificateDocument = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      { legalCertificateDocument } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    const source = {
      id: 'doc-1',
      title: 'Export License',
      documentType: 'license',
      categoryId: null,
      country: null,
      documentNumber: null,
      issuingOrganization: null,
      issueDate: null,
      expiryDate: null,
      description: null,
      fileId: 'file-1',
      previewImageId: null,
      active: true,
      featured: false,
      verified: true,
      translations: stubSixLocaleTranslations(),
    };
    legalCertificateDocument.findUnique.mockResolvedValue(source);
    legalCertificateDocument.count.mockResolvedValue(1);
    legalCertificateDocument.create.mockResolvedValue({
      id: 'doc-2',
      title: 'Export License — Copy',
      verified: false,
      translations: stubSixLocaleTranslations(),
    });

    const result = await service.duplicateLegalDocument('doc-1');

    const [call] = legalCertificateDocument.create.mock.calls[0] as [
      {
        data: {
          translations: Record<string, Record<string, string>>;
          verified: boolean;
        };
      },
    ];
    expect(call.data.translations).toEqual(stubSixLocaleTranslations());
    expect(Object.keys(call.data.translations)).toEqual([
      'en',
      'id',
      'zh',
      'th',
      'hi',
      'vi',
    ]);
    // Existing duplicate-specific behavior (verified is deliberately reset, never copied) must
    // survive this fix unchanged.
    expect(call.data.verified).toBe(false);
    expect(result.id).toBe('doc-2');
    expect(result.id).not.toBe(source.id);
    expect(legalCertificateDocument.update).not.toHaveBeenCalled();
  });
});

// P0.4-D3 — create/updateWhatWeDoItem() previously wrote `product_id` straight into Prisma with
// no existence check; a stale/deleted id fell through to an unhandled FK violation, surfacing
// as a raw 500 instead of a clean 400. `media_id` is deliberately untouched — it's already
// Media-registry-protected.
describe('AboutCompanyService.create/updateWhatWeDoItem — product_id validation (P0.4-D3)', () => {
  function buildService() {
    const whatWeDoItem = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const product = { findUnique: jest.fn<Promise<unknown>, unknown[]>() };
    const service = new AboutCompanyService(
      { whatWeDoItem, product } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    return { service, whatWeDoItem, product };
  }

  it('create: throws INVALID_PRODUCT (400) for a nonexistent product_id', async () => {
    const { service, product } = buildService();
    product.findUnique.mockResolvedValue(null);

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.createWhatWeDoItem({
        title: 'Export',
        product_id: 'missing-product',
      });
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('INVALID_PRODUCT');
    expect(thrown?.getStatus?.()).toBe(400);
  });

  it('create: a valid product_id proceeds exactly as before', async () => {
    const { service, whatWeDoItem, product } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    whatWeDoItem.count.mockResolvedValue(0);
    whatWeDoItem.create.mockResolvedValue({ id: 'item-1', title: 'Export' });

    const result = await service.createWhatWeDoItem({
      title: 'Export',
      product_id: 'p1',
    });

    expect(result.id).toBe('item-1');
  });

  it('create: omitting product_id never triggers a product lookup', async () => {
    const { service, whatWeDoItem, product } = buildService();
    whatWeDoItem.count.mockResolvedValue(0);
    whatWeDoItem.create.mockResolvedValue({ id: 'item-1', title: 'Export' });

    await service.createWhatWeDoItem({ title: 'Export' });

    expect(product.findUnique).not.toHaveBeenCalled();
  });

  it('update: throws INVALID_PRODUCT (400) for a nonexistent product_id', async () => {
    const { service, whatWeDoItem, product } = buildService();
    whatWeDoItem.findUnique.mockResolvedValue({
      id: 'item-1',
      translations: null,
    });
    product.findUnique.mockResolvedValue(null);

    let thrown: { code?: string } | undefined;
    try {
      await service.updateWhatWeDoItem('item-1', {
        product_id: 'missing-product',
      });
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('INVALID_PRODUCT');
  });

  it('update: a valid product_id proceeds exactly as before', async () => {
    const { service, whatWeDoItem, product } = buildService();
    whatWeDoItem.findUnique.mockResolvedValue({
      id: 'item-1',
      translations: null,
    });
    product.findUnique.mockResolvedValue({ id: 'p2' });
    whatWeDoItem.update.mockResolvedValue({ id: 'item-1', title: 'Export' });

    const result = await service.updateWhatWeDoItem('item-1', {
      product_id: 'p2',
    });

    expect(result.id).toBe('item-1');
  });

  it('update: omitting product_id never triggers a product lookup', async () => {
    const { service, whatWeDoItem, product } = buildService();
    whatWeDoItem.findUnique.mockResolvedValue({
      id: 'item-1',
      translations: null,
    });
    whatWeDoItem.update.mockResolvedValue({ id: 'item-1' });

    await service.updateWhatWeDoItem('item-1', { title: 'New' });

    expect(product.findUnique).not.toHaveBeenCalled();
  });
});

// P0.4-D3 — create/updateLegalDocument() previously wrote `category_id` straight into Prisma
// with no existence check; a stale/deleted id fell through to an unhandled FK violation,
// surfacing as a raw 500 instead of a clean 400. `file_id`/`preview_image_id` are deliberately
// untouched — they're already Media-registry-protected.
describe('AboutCompanyService.create/updateLegalDocument — category_id validation (P0.4-D3)', () => {
  function buildService() {
    const legalCertificateDocument = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn<Promise<unknown>, unknown[]>(),
      update: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const legalDocumentCategory = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    };
    const service = new AboutCompanyService(
      {
        legalCertificateDocument,
        legalDocumentCategory,
      } as unknown as PrismaService,
      {} as unknown as MediaService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {} as unknown as AiTranslationService,
    );
    return { service, legalCertificateDocument, legalDocumentCategory };
  }

  it('create: throws INVALID_CATEGORY (400) for a nonexistent category_id', async () => {
    const { service, legalDocumentCategory } = buildService();
    legalDocumentCategory.findUnique.mockResolvedValue(null);

    let thrown: { code?: string; getStatus?: () => number } | undefined;
    try {
      await service.createLegalDocument({
        title: 'License',
        category_id: 'missing-category',
      });
    } catch (err) {
      thrown = err as { code?: string; getStatus?: () => number };
    }
    expect(thrown?.code).toBe('INVALID_CATEGORY');
    expect(thrown?.getStatus?.()).toBe(400);
  });

  it('create: a valid category_id proceeds exactly as before', async () => {
    const { service, legalCertificateDocument, legalDocumentCategory } =
      buildService();
    legalDocumentCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
    legalCertificateDocument.count.mockResolvedValue(0);
    legalCertificateDocument.create.mockResolvedValue({
      id: 'doc-1',
      title: 'License',
    });

    const result = await service.createLegalDocument({
      title: 'License',
      category_id: 'cat-1',
    });

    expect(result.id).toBe('doc-1');
  });

  it('create: omitting category_id never triggers a category lookup', async () => {
    const { service, legalCertificateDocument, legalDocumentCategory } =
      buildService();
    legalCertificateDocument.count.mockResolvedValue(0);
    legalCertificateDocument.create.mockResolvedValue({
      id: 'doc-1',
      title: 'License',
    });

    await service.createLegalDocument({ title: 'License' });

    expect(legalDocumentCategory.findUnique).not.toHaveBeenCalled();
  });

  it('update: throws INVALID_CATEGORY (400) for a nonexistent category_id', async () => {
    const { service, legalCertificateDocument, legalDocumentCategory } =
      buildService();
    legalCertificateDocument.findUnique.mockResolvedValue({
      id: 'doc-1',
      previewImageId: 'preview-1',
      translations: null,
    });
    legalDocumentCategory.findUnique.mockResolvedValue(null);

    let thrown: { code?: string } | undefined;
    try {
      await service.updateLegalDocument('doc-1', {
        category_id: 'missing-category',
      });
    } catch (err) {
      thrown = err as { code?: string };
    }
    expect(thrown?.code).toBe('INVALID_CATEGORY');
  });

  it('update: a valid category_id proceeds exactly as before', async () => {
    const { service, legalCertificateDocument, legalDocumentCategory } =
      buildService();
    legalCertificateDocument.findUnique.mockResolvedValue({
      id: 'doc-1',
      previewImageId: 'preview-1',
      translations: null,
    });
    legalDocumentCategory.findUnique.mockResolvedValue({ id: 'cat-2' });
    legalCertificateDocument.update.mockResolvedValue({
      id: 'doc-1',
      title: 'License',
    });

    const result = await service.updateLegalDocument('doc-1', {
      category_id: 'cat-2',
    });

    expect(result.id).toBe('doc-1');
  });

  it('update: omitting category_id never triggers a category lookup', async () => {
    const { service, legalCertificateDocument, legalDocumentCategory } =
      buildService();
    legalCertificateDocument.findUnique.mockResolvedValue({
      id: 'doc-1',
      previewImageId: 'preview-1',
      translations: null,
    });
    legalCertificateDocument.update.mockResolvedValue({ id: 'doc-1' });

    await service.updateLegalDocument('doc-1', { title: 'New' });

    expect(legalDocumentCategory.findUnique).not.toHaveBeenCalled();
  });
});
