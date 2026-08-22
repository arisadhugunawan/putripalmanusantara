import { DEFAULT_LOCALE, isLocale, type Media, type ResolvedPageHeader } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";
import { PageHeaderPreview } from "./PageHeaderPreview";

/**
 * docs/03-design.md §9.2 — "Header halaman (breadcrumb + judul)" pattern used by every
 * listing/static page. Also emits the matching BreadcrumbList JSON-LD (NFR-SEO-01/05) so
 * the structured data can never drift out of sync with the visible breadcrumb.
 *
 * `locale` is optional and defaults to English: `next/root-params` can't help here (this
 * app's root layout intentionally sits outside app/[locale] so /admin can stay unprefixed,
 * which makes `locale` a regular nested param, not a root param), and re-threading it
 * through every one of this component's ~10 call sites wasn't worth it for a field that
 * only affects invisible structured-data URLs, not the visible, already-locale-correct
 * breadcrumb links. Pass `locale` explicitly from callers that already have it on hand.
 */
export function PageHeader({
  breadcrumb,
  title,
  titleAccent,
  description,
  locale,
  backgroundImage,
  headerConfig,
}: {
  breadcrumb: BreadcrumbItem[];
  title: string;
  /**
   * Optional leading portion of `title` to render in the brand accent colour (e.g. product
   * pages: "Coconut Shisha" accented, "Charcoal Briquette" plain). Must be an exact prefix of
   * `title` — if it isn't (stale data, or `title` was edited after `titleAccent` was set), the
   * mismatch is silently ignored and the whole title renders in one colour rather than
   * mis-splitting it partway through a word.
   */
  titleAccent?: string | null;
  description?: string;
  locale?: string;
  /**
   * Legacy single-photo prop — pre-dates the Inner Page Header system (Admin → Settings →
   * Inner Page Header) below. Only still read by callers that haven't passed `headerConfig`.
   */
  backgroundImage?: Media | null;
  /**
   * Resolved config from `getPageHeader(pageKey, locale)` (Inner Page Header — Admin →
   * Settings → Inner Page Header). Pass explicitly, even as `null`, to opt a page into the
   * full system (background, mobile background, overlay, position, colors, custom title/
   * subtitle, breadcrumb toggle); omit entirely to keep this component's original behaviour
   * unchanged for callers not yet migrated.
   */
  headerConfig?: ResolvedPageHeader | null;
}) {
  const resolvedLocale = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;

  if (headerConfig !== undefined) {
    return (
      <>
        <JsonLd
          data={breadcrumbJsonLd(
            breadcrumb.map((item) => ({ name: item.label, path: item.href })),
            resolvedLocale,
          )}
        />
        <PageHeaderPreview
          breadcrumb={breadcrumb}
          title={title}
          titleAccent={titleAccent}
          description={description}
          config={headerConfig}
        />
      </>
    );
  }

  const accent = titleAccent && title.startsWith(titleAccent) ? titleAccent : null;
  const rest = accent ? title.slice(accent.length) : title;

  return (
    <div className="relative overflow-hidden border-b border-neutral-200 bg-neutral-100">
      {backgroundImage && (
        <>
          <Image
            src={backgroundImage.file_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-neutral-100/85" />
        </>
      )}
      <JsonLd
        data={breadcrumbJsonLd(
          breadcrumb.map((item) => ({ name: item.label, path: item.href })),
          resolvedLocale,
        )}
      />
      <Container className="relative py-12 lg:py-16">
        <Breadcrumb items={breadcrumb} />
        <h1 className="mt-3 text-h1 text-neutral-900">
          {accent ? (
            <>
              <span className="text-accent-500">{accent}</span>
              {rest}
            </>
          ) : (
            title
          )}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{description}</p>}
      </Container>
    </div>
  );
}
