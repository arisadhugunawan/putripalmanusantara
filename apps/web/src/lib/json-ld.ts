import type { ArticleDetail, Faq, ProductDetail } from "@ppn/shared-types";
import { SITE_NAME, SITE_URL } from "./seo";

/** NFR-SEO-01 — Organization schema, present on every page. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Indonesian exporter of coconut-derived products: Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber.",
  };
}

export interface BreadcrumbLdItem {
  name: string;
  path?: string;
}

/** NFR-SEO-01/05 — BreadcrumbList, mirrors the visible <Breadcrumb> component. */
export function breadcrumbJsonLd(items: BreadcrumbLdItem[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? `${SITE_URL}/${locale}${item.path === "/" ? "" : item.path}` : undefined,
    })),
  };
}

/** NFR-SEO-01 — Product schema on detail pages. Includes the full gallery as `image[]`
 * and every specification (both card groups) as `additionalProperty` — no `offers`/price,
 * since this is a quotation-based B2B exporter with no public pricing to report. */
export function productJsonLd(product: ProductDetail, locale: string) {
  const images = [
    product.cover_image?.file_url,
    ...product.gallery.map((item) => item.media.file_url),
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    category: product.category,
    image: images.length > 0 ? images : undefined,
    url: `${SITE_URL}/${locale}/products/${product.slug}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    additionalProperty: product.specifications.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.spec_key,
      value: spec.spec_value,
    })),
  };
}

/** NFR-SEO-01 — Article schema on detail pages. */
export function articleJsonLd(article: ArticleDetail, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.cover_image?.file_url,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/${locale}/articles/${article.slug}`,
  };
}

/** NFR-SEO-01 — FAQPage schema for the Home page FAQ section. */
export function faqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
