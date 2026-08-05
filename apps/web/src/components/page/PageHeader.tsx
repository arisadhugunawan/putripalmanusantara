import { DEFAULT_LOCALE, isLocale } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

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
  description,
  locale,
}: {
  breadcrumb: BreadcrumbItem[];
  title: string;
  description?: string;
  locale?: string;
}) {
  const resolvedLocale = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <div className="border-b border-neutral-200 bg-neutral-100">
      <JsonLd
        data={breadcrumbJsonLd(
          breadcrumb.map((item) => ({ name: item.label, path: item.href })),
          resolvedLocale,
        )}
      />
      <Container className="py-12 lg:py-16">
        <Breadcrumb items={breadcrumb} />
        <h1 className="mt-3 text-h1 text-neutral-900">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{description}</p>}
      </Container>
    </div>
  );
}
