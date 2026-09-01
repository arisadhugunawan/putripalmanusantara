"use client";

import { Container, Section, cn } from "@ppn/ui-components";
import type { ArticleDetail, ArticleSummary, Locale } from "@ppn/shared-types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { SITE_URL, localeToBCP47 } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/page/Breadcrumb";
import { SafeImage } from "@/components/SafeImage";
import { ArticleCard } from "./ArticleCard";
import { ArticleDecorative } from "./ArticleDecorative";
import { ArticleToolsRail, BackToInsightsLink } from "./ArticleToolsRail";
import { BackToTop } from "./BackToTop";
import { KeyTakeaways } from "./KeyTakeaways";
import { QuoteBlock } from "./QuoteBlock";
import { ReadingProgressBar } from "./ReadingProgressBar";
import { RevealOnScroll } from "./RevealOnScroll";
import { StatisticsBlock } from "./StatisticsBlock";

/**
 * Shared between the public article page and the Admin draft preview (brief item 27/44:
 * preview must render "as close as possible to the public article page") — one rendering path
 * so the two can never quietly drift apart.
 */
export function ArticleDetailView({
  article,
  relatedArticles,
  locale,
  dictionary,
}: {
  article: ArticleDetail;
  relatedArticles: ArticleSummary[];
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.articles;
  const contentRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrevImage = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? null : (i - 1 + article.gallery_images.length) % article.gallery_images.length,
      ),
    [article.gallery_images.length],
  );
  const showNextImage = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % article.gallery_images.length)),
    [article.gallery_images.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevImage();
      if (event.key === "ArrowRight") showNextImage();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, showPrevImage, showNextImage]);

  const activeGalleryImage = lightboxIndex !== null ? article.gallery_images[lightboxIndex] : null;
  const dateLabel = new Date(article.published_at)
    .toLocaleDateString(localeToBCP47(locale), { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
  const shareUrl = `${SITE_URL}/${locale}/articles/${article.slug}`;
  const breadcrumbItems = [
    { label: dictionary.nav.home, href: "/" },
    { label: t.breadcrumbInsights, href: "/articles" },
    // Category has no dedicated listing page in this project (yet) — shown as a plain,
    // non-clickable crumb per brief item 4's own conditional ("category page if available").
    ...(article.category ? [{ label: article.category.name }] : []),
    { label: article.title },
  ];

  return (
    <main>
      <ReadingProgressBar targetRef={contentRef} />
      <JsonLd
        data={breadcrumbJsonLd(
          breadcrumbItems.map((item) => ({ name: item.label, path: item.href })),
          locale,
        )}
      />

      <div ref={contentRef}>
        {/* ── Editorial hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-linear-to-b from-primary-50/70 via-white to-white">
          <ArticleDecorative />
          <Container className="relative py-10 lg:py-16">
            <Breadcrumb items={breadcrumbItems} />

            <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                {article.category && (
                  <p className="text-small font-semibold uppercase tracking-[0.08em] text-primary-700">
                    {article.category.name}
                  </p>
                )}
                <h1 className="mt-3 font-heading text-[clamp(2rem,1.2rem+4.2vw,3.9rem)] font-bold leading-[1.08] tracking-tight text-neutral-900">
                  {article.title}
                </h1>
                <p className="mt-5 max-w-xl text-body-lg text-neutral-600">{article.excerpt}</p>
                <p className="mt-6 text-small uppercase tracking-wide text-neutral-500">
                  {article.author} <span aria-hidden="true">·</span> {dateLabel}{" "}
                  <span aria-hidden="true">·</span>{" "}
                  {t.minReadTemplate.replace("{minutes}", String(article.reading_time_minutes))}
                </p>
                <div className="mt-6 lg:hidden">
                  <ArticleToolsRail url={shareUrl} title={article.title} orientation="horizontal" labels={t} />
                </div>
              </div>

              {/* Brief item 33 — mobile stacks title first, image second; DOM order already
                  reads that way top-to-bottom, so no order-* override is needed here. On
                  desktop the same order simply becomes left column / right column. */}
              <div className="relative aspect-16/10 overflow-hidden rounded-card bg-neutral-100 lg:aspect-16/11">
                <SafeImage
                  media={article.cover_image}
                  priority
                  fit="contain"
                  className="animate-article-hero-reveal"
                />
              </div>
            </div>
          </Container>
        </section>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <Section>
          <Container className="max-w-3xl">
            <div className="lg:grid lg:grid-cols-[3rem_1fr] lg:gap-8">
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <ArticleToolsRail url={shareUrl} title={article.title} orientation="vertical" labels={t} />
                </div>
              </aside>

              <div className="min-w-0">
                <div
                  className={cn("prose article-drop-cap max-w-none text-body-lg text-neutral-600")}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />

                <QuoteBlock text={article.quote_text} author={article.quote_author} />
                <KeyTakeaways items={article.key_takeaways} label={t.keyTakeawaysLabel} />
                <StatisticsBlock statistics={article.statistics} locale={locale} />

                {article.gallery_images.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-h3 text-neutral-900">{t.galleryHeading}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {article.gallery_images.map((item, index) => (
                        <RevealOnScroll key={item.id} delayMs={index * 80}>
                          <figure className="group relative aspect-square overflow-hidden rounded-field">
                            <button
                              type="button"
                              onClick={() => setLightboxIndex(index)}
                              aria-label={t.lightboxImageAriaTemplate.replace("{name}", item.media.alt_text)}
                              className="absolute inset-0 h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
                            >
                              <SafeImage
                                media={item.media}
                                sizes="(min-width: 640px) 33vw, 50vw"
                                className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                              />
                            </button>
                          </figure>
                          {item.caption && (
                            <figcaption className="mt-1.5 text-small text-neutral-500">{item.caption}</figcaption>
                          )}
                        </RevealOnScroll>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6">
                  <div className="lg:hidden">
                    <ArticleToolsRail url={shareUrl} title={article.title} orientation="horizontal" labels={t} />
                  </div>
                  {article.instagram_url && (
                    <div className="text-small text-neutral-600">
                      <span>{t.alsoSharedOnInstagramText} </span>
                      <a
                        href={article.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-700 underline"
                      >
                        {dictionary.home.articles.viewOnInstagramCta} <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  )}
                </div>

                {article.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-small text-neutral-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </div>

      {relatedArticles.length > 0 && (
        <Section tone="soft">
          <Container>
            <p className="text-small font-semibold uppercase tracking-wide text-primary-700">
              {t.relatedInsightsEyebrow}
            </p>
            <h2 className="mt-1 text-h2 text-neutral-900">{t.relatedInsightsHeading}</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related, index) => (
                <RevealOnScroll key={related.id} delayMs={index * 100}>
                  <ArticleCard article={related} dictionary={dictionary} locale={locale} />
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Container className="max-w-3xl py-10">
        <BackToInsightsLink href="/articles">{t.backToInsightsCta}</BackToInsightsLink>
      </Container>

      <BackToTop ariaLabel={t.backToTopAriaLabel} />

      {activeGalleryImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeGalleryImage.media.alt_text}
          className="fixed inset-0 z-100 flex items-center justify-center bg-neutral-900/95 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label={t.lightboxCloseLabel}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <CloseIcon />
          </button>

          {article.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevImage();
              }}
              aria-label={t.lightboxPreviousLabel}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:left-4"
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          <div
            className="relative h-[80vh] w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <SafeImage media={activeGalleryImage.media} fit="contain" sizes="100vw" />
          </div>

          {article.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label={t.lightboxNextLabel}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/10 sm:right-4"
            >
              <ChevronIcon direction="right" />
            </button>
          )}

          {activeGalleryImage.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-small text-white/80">
              {activeGalleryImage.caption}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn("h-6 w-6", direction === "right" && "rotate-180")}
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
