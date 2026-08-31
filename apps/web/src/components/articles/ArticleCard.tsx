import { Card } from "@ppn/ui-components";
import type { ArticleSummary, Locale } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import type { Dictionary } from "@/i18n/dictionary.d";
import { localeToBCP47 } from "@/lib/seo";
import { SafeImage } from "@/components/SafeImage";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** `dictionary`/`locale` are optional — only the Homepage's carousel (`ArticlesSection`)
 * currently passes them; the Articles listing page, Article Detail's "Related Insights", and
 * the admin preview keep this card's original English-only text for now (out of scope for
 * the Homepage-only i18n pass — see README "Internationalization"). */
export function ArticleCard({
  article,
  dictionary,
  locale,
}: {
  article: ArticleSummary;
  dictionary?: Dictionary;
  locale?: Locale;
}) {
  const date = new Date(article.published_at).toLocaleDateString(locale ? localeToBCP47(locale) : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fromInstagram = article.content_source === "instagram" || article.content_source === "both";
  const instagramBadgeText = dictionary?.home.articles.instagramBadge ?? "Originally shared on Instagram";
  const readArticleText = dictionary?.home.articles.readArticleCta ?? "Read Article";
  const viewOnInstagramText = dictionary?.home.articles.viewOnInstagramCta ?? "View on Instagram";

  return (
    <Card hoverable className="flex h-full flex-col overflow-hidden p-0">
      <Link href={`/articles/${article.slug}`} className="group block flex-1">
        <div className="relative aspect-16/10 overflow-hidden">
          <SafeImage
            media={article.cover_image}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {fromInstagram && (
            <span
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 backdrop-blur-sm"
              title={instagramBadgeText}
            >
              <InstagramGlyph className="h-4 w-4" />
              <span className="sr-only">{instagramBadgeText}</span>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 pb-4">
          {article.category && (
            <p className="text-small font-medium uppercase tracking-wide text-primary-700">
              {article.category.name}
            </p>
          )}
          <h3 className="mt-1 text-h3 text-neutral-900">{article.title}</h3>
          <p className="mt-2 flex-1 text-body text-neutral-600">{article.excerpt}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-small text-neutral-600">{date}</p>
            <span className="flex items-center gap-1 text-body font-medium text-primary-700">
              {readArticleText}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary-600 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
      {fromInstagram && article.instagram_url && (
        <a
          href={article.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 border-t border-neutral-100 px-6 py-3 text-small font-medium text-neutral-600 hover:text-primary-700"
        >
          <InstagramGlyph className="h-3.5 w-3.5" />
          {viewOnInstagramText}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>
      )}
    </Card>
  );
}
