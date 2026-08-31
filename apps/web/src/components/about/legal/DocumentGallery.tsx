"use client";

import type { LegalCertificateDocument, LegalDocumentCategory, LegalDocumentType } from "@ppn/shared-types";
import { legalDocumentCategoryLabel } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Dictionary } from "@/i18n/dictionary.d";
import { DocumentViewer } from "./DocumentViewer";

/** Locale-aware equivalent of `LEGAL_DOCUMENT_TYPE_LABELS` (`@ppn/shared-types`), used only as
 * the fallback when a document has no Admin-assigned category. */
function buildTypeLabels(dict: Dictionary): Record<LegalDocumentType, string> {
  return {
    certificate: dict.aboutCompany.legalCertificate.typeCertificate,
    legal_document: dict.aboutCompany.legalCertificate.typeLegalDocument,
    business_license: dict.aboutCompany.legalCertificate.typeBusinessLicense,
    registration_document: dict.aboutCompany.legalCertificate.typeRegistrationDocument,
    export_certificate: dict.aboutCompany.legalCertificate.typeExportCertificate,
    quality_certificate: dict.aboutCompany.legalCertificate.typeQualityCertificate,
    other: dict.aboutCompany.legalCertificate.typeOther,
  };
}

const STAGGER_MS = 60;
const MAX_STAGGER_MS = 480;

/**
 * Document grid + category filter for the Legal & Company Information section.
 *
 * Cards render the pre-generated preview (image document or Admin-uploaded preview image), never
 * the full asset, so the gallery stays light; the viewer then reuses that already-decoded image
 * as its instant base layer.
 */
export function DocumentGallery({
  documents,
  categories,
  dictionary,
}: {
  documents: LegalCertificateDocument[];
  categories: LegalDocumentCategory[];
  dictionary: Dictionary;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const gridRef = useRef<HTMLUListElement>(null);
  const tiltRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reducedMotion = useReducedMotion();
  const typeLabels = useMemo(() => buildTypeLabels(dictionary), [dictionary]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Only categories that actually have documents get a filter chip — an empty filter is a
  // dead end for the visitor.
  const usedSlugs = useMemo(
    () => new Set(documents.map((d) => d.category?.slug).filter(Boolean) as string[]),
    [documents],
  );
  const chips = categories.filter((c) => c.active && usedSlugs.has(c.slug));

  const visible = activeSlug
    ? documents.filter((d) => d.category?.slug === activeSlug)
    : documents;

  function handleTiltMove(id: string, event: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const inner = tiltRefs.current[id];
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    inner.style.transform = `rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }
  function handleTiltLeave(id: string) {
    const inner = tiltRefs.current[id];
    if (!inner) return;
    inner.style.transform = "";
  }

  return (
    <>
      {chips.length > 1 && (
        // Horizontal scroll on mobile rather than wrapping into a tall block (item 44).
        <div className="mt-7 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            label={dictionary.aboutCompany.legalCertificate.filterAll}
            selected={activeSlug === null}
            onClick={() => setActiveSlug(null)}
          />
          {chips.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              selected={activeSlug === category.slug}
              onClick={() => setActiveSlug(category.slug)}
            />
          ))}
        </div>
      )}

      <ul
        ref={gridRef}
        className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {visible.map((doc, index) => {
          const previewMedia = doc.preview_image ?? (doc.file?.file_type === "image" ? doc.file : null);
          // Index within the *unfiltered* list, so viewer paging matches what is on screen.
          const viewerIndex = visible.indexOf(doc);

          return (
            <li
              key={doc.id}
              className={cn(
                "transition-[opacity,transform] duration-[600ms] ease-out",
                revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
              )}
              style={{
                transitionDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`,
                perspective: "1400px",
              }}
            >
              <div
                ref={(node) => {
                  tiltRefs.current[doc.id] = node;
                }}
                onMouseMove={(event) => handleTiltMove(doc.id, event)}
                onMouseLeave={() => handleTiltLeave(doc.id)}
                className="h-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
              >
                <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#DDE4DC] bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:border-[#6FAF3D]/50 hover:shadow-[0_16px_40px_-16px_rgba(49,95,58,0.35)] focus-within:-translate-y-1.5 focus-within:shadow-[0_16px_40px_-16px_rgba(49,95,58,0.35)]">
                  <button
                    type="button"
                    onClick={() => doc.file && setOpenIndex(viewerIndex)}
                    disabled={!doc.file}
                    className="relative aspect-4/3 overflow-hidden bg-[#F7F9F4] text-left disabled:cursor-default"
                  >
                    {previewMedia ? (
                      <Image
                        src={previewMedia.file_url}
                        alt={previewMedia.alt_text || doc.title}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                        // contain, never cover: cropping a legal document can hide required text.
                        className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <DocumentPlaceholder isPdf={doc.file?.file_type === "pdf"} dictionary={dictionary} />
                    )}
                    {doc.verified && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-small font-medium text-[#315F3A] shadow-[0_2px_10px_rgba(49,95,58,0.15)]">
                        {dictionary.aboutCompany.legalCertificate.verifiedBadge}
                      </span>
                    )}
                    {doc.file && (
                      <span className="absolute inset-0 flex items-center justify-center bg-[#202522]/0 opacity-0 transition-[opacity,background-color] duration-300 ease-out group-hover:bg-[#202522]/45 group-hover:opacity-100">
                        <span className="translate-y-1.5 text-small font-semibold uppercase tracking-[0.12em] text-white transition-transform duration-300 ease-out group-hover:translate-y-0">
                          {dictionary.aboutCompany.legalCertificate.viewDocumentCta}
                        </span>
                      </span>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-body-lg font-medium text-[#202522]">{doc.title}</h3>
                    <p className="mt-1 text-small font-medium uppercase tracking-wide text-[#68736B]">
                      {legalDocumentCategoryLabel(doc, typeLabels)}
                    </p>

                    {doc.file && (
                      <button
                        type="button"
                        onClick={() => setOpenIndex(viewerIndex)}
                        className="mt-auto pt-3 text-left text-small font-medium text-[#315F3A] underline underline-offset-4 transition-colors hover:text-[#6FAF3D]"
                      >
                        {dictionary.aboutCompany.legalCertificate.viewDocumentCta}
                        <span className="sr-only"> {doc.title}</span>
                      </button>
                    )}
                  </div>
                </article>
              </div>
            </li>
          );
        })}
      </ul>

      {openIndex !== null && (
        <DocumentViewer
          documents={visible}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          dictionary={dictionary}
        />
      )}
    </>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-button border px-4 py-1.5 text-small transition-colors",
        selected
          ? "border-[#315F3A] bg-[#315F3A]/10 font-medium text-[#315F3A]"
          : "border-[#DDE4DC] bg-white text-[#68736B] hover:border-[#6FAF3D]/60",
      )}
    >
      {label}
    </button>
  );
}

/** Document-styled placeholder for a PDF with no Admin-uploaded preview image — deliberately
 * page-shaped rather than a bare file icon, so the card still reads as a document. */
function DocumentPlaceholder({ isPdf, dictionary }: { isPdf: boolean; dictionary: Dictionary }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#F7F9F4] to-[#DDE4DC]/40">
      <div className="flex h-[70%] w-[52%] flex-col gap-1.5 rounded-[6px] border border-[#DDE4DC] bg-white p-2.5 shadow-[0_2px_10px_rgba(49,95,58,0.1)]">
        <span className="h-1.5 w-3/4 rounded-full bg-[#DDE4DC]" />
        <span className="h-1.5 w-full rounded-full bg-[#DDE4DC]" />
        <span className="h-1.5 w-full rounded-full bg-[#DDE4DC]" />
        <span className="h-1.5 w-2/3 rounded-full bg-[#DDE4DC]" />
        <span className="mt-auto text-[10px] font-semibold tracking-wide text-[#315F3A]">
          {isPdf ? dictionary.aboutCompany.legalCertificate.placeholderPdf : dictionary.aboutCompany.legalCertificate.placeholderGeneric}
        </span>
      </div>
    </div>
  );
}
