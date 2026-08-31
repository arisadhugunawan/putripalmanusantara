import { toAboutCompanyTeamSection } from './team-section.mapper';

function stubTeamSectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'team-section-1',
    eyebrow: 'Eyebrow',
    heading: 'Heading',
    description: 'Description',
    ctaLabel: 'Meet the Team',
    ctaHref: '/about#team',
    showCounter: true,
    translations: null,
    ...overrides,
  };
}

// About Company Multilingual — `cta_label` was previously copied straight from the base row
// regardless of `locale`, unlike its sibling eyebrow/heading/description fields, so the "PPN
// Team" section's visible CTA button stayed English-only in every locale. Fixed by adding
// `ctaLabel` to the same `translate()` field list its siblings already use.
describe('toAboutCompanyTeamSection — cta_label locale fallback', () => {
  it('falls back to the base (English) cta_label when no translation exists for the locale', () => {
    const row = stubTeamSectionRow();
    const result = toAboutCompanyTeamSection(row as never, 'id');
    expect(result.cta_label).toBe('Meet the Team');
  });

  it('uses the translated cta_label when one exists for the requested locale', () => {
    const row = stubTeamSectionRow({
      translations: { id: { ctaLabel: 'Temui Tim Kami' } },
    });
    const result = toAboutCompanyTeamSection(row as never, 'id');
    expect(result.cta_label).toBe('Temui Tim Kami');
  });

  it('leaves cta_label as the base value for the default locale', () => {
    const row = stubTeamSectionRow({
      translations: { id: { ctaLabel: 'Temui Tim Kami' } },
    });
    const result = toAboutCompanyTeamSection(row as never, 'en');
    expect(result.cta_label).toBe('Meet the Team');
  });
});
