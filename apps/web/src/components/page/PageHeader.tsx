import { Container } from "@ppn/ui-components";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

/**
 * docs/03-design.md §9.2 — "Header halaman (breadcrumb + judul)" pattern used by every
 * listing/static page. Also emits the matching BreadcrumbList JSON-LD (NFR-SEO-01/05) so
 * the structured data can never drift out of sync with the visible breadcrumb.
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
}: {
  breadcrumb: BreadcrumbItem[];
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-neutral-200 bg-neutral-100">
      <JsonLd data={breadcrumbJsonLd(breadcrumb.map((item) => ({ name: item.label, path: item.href })))} />
      <Container className="py-12 lg:py-16">
        <Breadcrumb items={breadcrumb} />
        <h1 className="mt-3 text-h1 text-neutral-900">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-body-lg text-neutral-600">{description}</p>}
      </Container>
    </div>
  );
}
