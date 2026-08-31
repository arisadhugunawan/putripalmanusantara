import type {
  AboutCompanyFact,
  AboutCompanyProfile,
  AboutCompanySocialLink,
  ExportDestination,
} from "@ppn/shared-types";
import type { Dictionary } from "@/i18n/dictionary.d";
import { FadeUpSection } from "./FadeUpSection";
import { AboutCompanySocialRow } from "./company-profile/AboutCompanySocialRow";
import { CompanyLegalDataTable } from "./company-profile/CompanyLegalDataTable";
import { CountriesExportedSection } from "./company-profile/CountriesExportedSection";
import { YouTubeVideoEmbed } from "./company-profile/YouTubeVideoEmbed";

/**
 * Section 01 — "CV. Putri Palma Nusantara", fully redesigned (see README "CV. Putri Palma
 * Nusantara — Premium Redesign"): WHO WE ARE (intro + video + social) → COMPANY LEGAL DATA →
 * COUNTRIES WE HAVE EXPORTED TO. The previous nine-block story (Company Story, Business Scope,
 * the old Company Facts icon-grid, the old fixed-field Legal block, Closing statement, and the
 * free-form gallery/company-overview) is intentionally not rendered by this component anymore —
 * every one of those fields still exists in the database and its own Admin editor untouched
 * (nothing was deleted), this redesign simply replaces what the public page shows with the
 * brief's explicit three-section flow.
 *
 * Two deliberate reuses rather than new systems: "Company Legal Data" renders the *existing*
 * `AboutCompanyFact` rows (already a flexible label/value CRUD, already holding real Company/
 * Location/Business/Products data) alongside the four original fixed legal fields, instead of a
 * second parallel model. "Countries We Have Exported To" reuses the exact same
 * `ExportDestination` records the Homepage's own Global Export Reach map uses, curated
 * independently via `show_in_company_profile` so the two surfaces can show different sets of
 * the same real country list without ever disagreeing about what a country's own data is.
 */
export function CompanyProfileSection({
  profile,
  facts,
  socialLinks,
  companyProfileCountries,
  dictionary,
}: {
  profile: AboutCompanyProfile;
  facts: AboutCompanyFact[];
  socialLinks: AboutCompanySocialLink[];
  companyProfileCountries: ExportDestination[];
  dictionary: Dictionary;
}) {
  const legalRows = [
    { id: "company-name", label: dictionary.aboutCompany.companyProfile.legalCompanyName, value: profile.headline },
    { id: "business-type", label: dictionary.aboutCompany.companyProfile.legalBusinessType, value: profile.business_type },
    {
      id: "registered-address",
      label: dictionary.aboutCompany.companyProfile.legalRegisteredAddress,
      value: profile.registered_address,
    },
    {
      id: "business-id-number",
      label: dictionary.aboutCompany.companyProfile.legalBusinessId,
      value: profile.business_id_number,
    },
    { id: "established", label: dictionary.aboutCompany.companyProfile.legalEstablished, value: profile.established_year },
    ...facts.filter((fact) => fact.active).map((fact) => ({ id: fact.id, label: fact.label, value: fact.value })),
  ].filter((row) => row.value.trim().length > 0);

  const showLegal = profile.legal_visible && legalRows.length > 0;
  const showExport = profile.export_visible && companyProfileCountries.length > 0;
  const showSocial = profile.social_visible && socialLinks.length > 0;

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {/* 01 — Who We Are */}
      <FadeUpSection>
        <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-[#245C3A]">
          <span className="h-px w-8 bg-[#6FAF3A]" aria-hidden="true" />
          {profile.eyebrow}
        </p>
        <h2 className="mt-4 text-balance text-h2 text-[#17221B]">{profile.headline}</h2>
        {profile.subheading && (
          <p className="mt-3 text-balance text-h3 font-normal text-neutral-700">{profile.subheading}</p>
        )}
        {profile.short_description && (
          <p className="mt-5 max-w-2xl text-body-lg text-[#68736C]">{profile.short_description}</p>
        )}

        {profile.youtube_video_url && (
          <div className="mt-9 max-w-3xl">
            <YouTubeVideoEmbed url={profile.youtube_video_url} dictionary={dictionary} />
          </div>
        )}

        {showSocial && (
          <div className="mt-8">
            <AboutCompanySocialRow links={socialLinks} label={profile.social_label} />
          </div>
        )}
      </FadeUpSection>

      {/* 02 — Company Legal Data */}
      {showLegal && (
        <FadeUpSection>
          <div className="max-w-2xl">
            {profile.legal_label && (
              <p className="text-small font-medium uppercase tracking-[0.14em] text-[#245C3A]">
                {profile.legal_label}
              </p>
            )}
            {profile.legal_heading && (
              <h3 className="mt-3 text-balance text-h3 text-[#17221B]">{profile.legal_heading}</h3>
            )}
          </div>
          <div className="mt-7">
            <CompanyLegalDataTable rows={legalRows} />
          </div>
          {/* Links to the dedicated section rather than duplicating the certificate gallery. */}
          <a
            href="#legal"
            className="mt-4 inline-flex text-small font-medium text-[#245C3A] underline underline-offset-4"
          >
            {dictionary.aboutCompany.companyProfile.viewLegalDocsCta}
          </a>
        </FadeUpSection>
      )}

      {/* 03 — Countries We Have Exported To */}
      {showExport && (
        <FadeUpSection>
          <CountriesExportedSection
            countries={companyProfileCountries}
            heading={profile.export_label}
            description={profile.export_description}
            dictionary={dictionary}
          />
        </FadeUpSection>
      )}
    </div>
  );
}
