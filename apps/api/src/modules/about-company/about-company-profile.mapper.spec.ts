import { toAboutCompanyProfile } from './about-company-profile.mapper';

function stubProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    headline: 'Headline',
    shortDescription: 'Short description',
    mainDescription: '<p>Clean</p>',
    vision: 'Vision',
    mission: 'Mission',
    companyOverview: '<p>Clean overview</p>',
    mainImage: null,
    storyImage: null,
    gallery: [],
    eyebrow: 'Eyebrow',
    subheading: 'Subheading',
    ctaLabel: 'CTA',
    ctaHref: '/contact',
    youtubeVideoUrl: null,
    socialLabel: 'Follow us',
    socialVisible: true,
    storyLabel: 'Story',
    storyHeading: 'Story heading',
    storyDescription: 'Story description',
    storySecondaryDescription: 'Story secondary',
    storyVisible: true,
    scopeLabel: 'Scope',
    scopeHeading: 'Scope heading',
    scopeDescription: 'Scope description',
    scopeVisible: true,
    factsLabel: 'Facts',
    factsHeading: 'Facts heading',
    factsVisible: true,
    exportLabel: 'Export',
    exportHeading: 'Export heading',
    exportDescription: 'Export description',
    exportVisible: true,
    legalLabel: 'Legal',
    legalHeading: 'Legal heading',
    businessType: 'PT',
    registeredAddress: 'Address',
    businessIdNumber: '1234567890',
    establishedYear: 2005,
    legalVisible: true,
    closingLabel: 'Closing',
    closingHeading: 'Closing heading',
    closingDescription: 'Closing description',
    closingCtaLabel: 'Contact us',
    closingCtaHref: '/contact',
    closingVisible: true,
    translations: null,
    ...overrides,
  };
}

// Phase 5F-P0.1 — read-time defense-in-depth for About Company's rich-text fields. These
// simulate rows saved BEFORE the write-time sanitization existed. toAboutCompanyProfile() is the
// one shared mapper used by both the public page (if ever wired up) and the AI content extractor
// (extractAboutCompany()), so sanitizing here protects every consumer without any migration.
describe('toAboutCompanyProfile — read-time XSS defense (Phase 5F-P0.1)', () => {
  it('strips a <script> payload from a pre-existing unsanitized main_description', () => {
    const row = stubProfileRow({
      mainDescription: '<p>Hello</p><script>alert(1)</script>',
    });

    const result = toAboutCompanyProfile(row as never, 'en');

    expect(result.main_description).not.toContain('<script');
    expect(result.main_description).not.toContain('alert(1)');
    expect(result.main_description).toContain('<p>Hello</p>');
  });

  it('strips an onerror payload from a pre-existing unsanitized company_overview', () => {
    const row = stubProfileRow({
      companyOverview: '<img src="x" onerror="alert(1)"><p>Overview</p>',
    });

    const result = toAboutCompanyProfile(row as never, 'en');

    expect(result.company_overview).not.toContain('onerror');
    expect(result.company_overview).not.toContain('alert(1)');
    expect(result.company_overview).toContain('<p>Overview</p>');
  });

  it('strips a payload from a pre-existing unsanitized translated field', () => {
    const row = stubProfileRow({
      translations: {
        th: {
          mainDescription: '<svg onload=alert(1)></svg><p>สะอาด</p>',
          companyOverview: '<p>ภาพรวม</p>',
        },
      },
    });

    const result = toAboutCompanyProfile(row as never, 'th');

    expect(result.main_description).not.toContain('<svg');
    expect(result.main_description).not.toContain('onload');
    expect(result.main_description).toContain('<p>สะอาด</p>');
  });

  it('leaves already-clean content unchanged (idempotent, no visible diff)', () => {
    const row = stubProfileRow({
      mainDescription: '<h2>Heading</h2><p><strong>Bold</strong></p>',
    });

    const result = toAboutCompanyProfile(row as never, 'en');

    expect(result.main_description).toBe(
      '<h2>Heading</h2><p><strong>Bold</strong></p>',
    );
  });
});
