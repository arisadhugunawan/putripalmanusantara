import type { EventEmitter2 } from '@nestjs/event-emitter';
import { resolveAboutCompanySectionStatus } from '@ppn/shared-types';
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
