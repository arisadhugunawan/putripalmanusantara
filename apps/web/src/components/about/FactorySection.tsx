import type { Facility, FactoryProfile } from "@ppn/shared-types";
import { buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { AnimatedEyebrowLine } from "./AnimatedEyebrowLine";
import { FactoryGalleryCarousel } from "./factory/FactoryGalleryCarousel";
import { FactoryVideoShowcase } from "./factory/FactoryVideoShowcase";
import { FadeUpSection } from "./FadeUpSection";

/**
 * Section 05 — "Factory" (singleton, distinct from the separate Facilities module — the Factory
 * section tells the CMS-authored "our factory" story; `facilities` still links out to the
 * dedicated Facilities page for full specs/photos, unchanged from the old hardcoded page).
 *
 * Redesigned as a real operational showcase (brief: "REAL OPERATIONAL FACILITY SHOWCASE, bukan
 * daftar fasilitas biasa") — a TikTok video up top, then a 3D horizontal photo gallery. The old
 * plain grid of gallery thumbnails and the flat text list of facility names are gone entirely;
 * `location`/`capacity`/`operational_info` still live in `FactoryProfile` and stay Admin-editable,
 * they just aren't rendered as a text list here anymore — the video and gallery carry that
 * impression visually instead, per the brief's explicit instruction.
 */
export function FactorySection({ factory, facilities }: { factory: FactoryProfile; facilities: Facility[] }) {
  return (
    <FadeUpSection>
      <p className="flex items-center gap-3 text-small font-medium uppercase tracking-[0.14em] text-[#315F3A]">
        <AnimatedEyebrowLine />
        {factory.eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-h2 text-[#202522]">{factory.name}</h2>
      {factory.short_description && (
        <p className="mt-4 max-w-2xl text-body-lg text-[#68736B]">{factory.short_description}</p>
      )}

      <div className="mt-9">
        <FactoryVideoShowcase videos={factory.videos} />
      </div>

      {factory.gallery.length > 0 && (
        <div className="mt-14">
          <h3 className="text-h3 text-[#202522]">Factory in Pictures</h3>
          <p className="mt-2 max-w-2xl text-body text-[#68736B]">
            A closer look at our facilities, people, handling process, and export preparation.
          </p>
          <div className="mt-7">
            <FactoryGalleryCarousel images={factory.gallery} />
          </div>
        </div>
      )}

      {factory.documents.length > 0 && (
        <ul className="mt-9 flex flex-col gap-2">
          {factory.documents.map((doc) => (
            <li key={doc.id}>
              {doc.file ? (
                <a
                  href={doc.file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body font-medium text-[#315F3A] underline underline-offset-4 hover:text-[#6FAF3D]"
                >
                  {doc.title}
                </a>
              ) : (
                <span className="text-body text-[#68736B]">{doc.title}</span>
              )}
              {doc.description && <p className="text-small text-[#68736B]">{doc.description}</p>}
            </li>
          ))}
        </ul>
      )}

      {factory.detailed_description && (
        <p className="mt-6 max-w-2xl text-body text-[#68736B]">{factory.detailed_description}</p>
      )}
      {factory.additional_notes && (
        <p className="mt-3 max-w-2xl text-small text-[#68736B]">{factory.additional_notes}</p>
      )}

      {facilities.length > 0 && (
        <Link href="/facilities" className={`mt-9 inline-flex ${buttonVariants("secondary", "md")}`}>
          View All Facilities →
        </Link>
      )}
    </FadeUpSection>
  );
}
