import type {
  AboutCompanyLegalSection,
  LegalCertificateDocument,
  LegalDocumentCategory,
} from "@ppn/shared-types";
import { isLegalDocumentExpired } from "@ppn/shared-types";
import { buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { AnimatedEyebrowLine } from "./AnimatedEyebrowLine";
import { FadeUpSection } from "./FadeUpSection";
import { DocumentGallery } from "./legal/DocumentGallery";

/**
 * Section 04 — "Legal & Company Information".
 *
 * `documents` arrives active-only and order-sorted from the published snapshot. Expired
 * documents stay visible unless the Admin explicitly turned on "hide expired" — hiding a
 * document is a business decision, never silent behaviour.
 *
 * The company-details panel this brief also describes is deliberately NOT rendered here: the
 * "CV. Putri Palma Nusantara" section already owns Company Information and Company Facts, and
 * duplicating them would give the page two sources of truth for the same data.
 */
export function LegalCertificateSection({
  documents,
  section,
  categories,
  dictionary,
}: {
  documents: LegalCertificateDocument[];
  section: AboutCompanyLegalSection;
  categories: LegalDocumentCategory[];
  dictionary: Dictionary;
}) {
  const visibleDocuments = section.hide_expired
    ? documents.filter((doc) => !isLegalDocumentExpired(doc))
    : documents;
  const allVerified = visibleDocuments.length > 0 && visibleDocuments.every((doc) => doc.verified);
  const isPlural = visibleDocuments.length !== 1;
  const counterWord = allVerified
    ? isPlural
      ? dictionary.aboutCompany.legalCertificate.verifiedDocumentPlural
      : dictionary.aboutCompany.legalCertificate.verifiedDocumentSingular
    : isPlural
      ? dictionary.aboutCompany.legalCertificate.documentPlural
      : dictionary.aboutCompany.legalCertificate.documentSingular;
  const counterLabel = `${visibleDocuments.length} ${counterWord}`;

  return (
    <div className="relative overflow-hidden rounded-card bg-linear-to-b from-white to-[#F7F9F4] p-6 sm:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(167,217,76,0.16), transparent 70%)" }}
        aria-hidden="true"
      />
      <DocumentPatternDecor className="pointer-events-none absolute -right-12 top-6 h-56 w-56 text-[#315F3A]/[0.05]" />

      <div className="relative">
        <FadeUpSection>
          <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-[#315F3A]">
            <AnimatedEyebrowLine />
            {section.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-h2 text-[#202522]">{section.heading}</h2>
          {section.description && (
            <p className="mt-4 max-w-2xl text-body-lg text-[#68736B]">{section.description}</p>
          )}
          {visibleDocuments.length > 0 && (
            <p className="mt-3 text-small font-semibold tracking-[0.1em] text-[#6FAF3D]">
              {counterLabel}
            </p>
          )}
        </FadeUpSection>

        {visibleDocuments.length === 0 ? (
          <p className="mt-7 max-w-2xl text-body-lg text-[#68736B]">
            {dictionary.aboutCompany.legalCertificate.emptyState}
          </p>
        ) : (
          <DocumentGallery documents={visibleDocuments} categories={categories} dictionary={dictionary} />
        )}

        <FadeUpSection>
          <Link href="/contact" className={`mt-9 inline-flex ${buttonVariants("secondary", "md")}`}>
            {dictionary.aboutCompany.legalCertificate.contactUsCta}
          </Link>
        </FadeUpSection>
      </div>
    </div>
  );
}

/** Very low-opacity stacked-page motif — corporate rather than agricultural, per the brief. */
function DocumentPatternDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="30" y="20" width="110" height="150" rx="8" />
      <rect x="50" y="35" width="110" height="150" rx="8" />
      <path d="M70 70h70M70 92h70M70 114h48" />
    </svg>
  );
}
