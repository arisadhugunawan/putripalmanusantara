import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles, getRelatedArticles } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { items } = await getArticles(1, 100);
  return items.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/articles/[slug]">): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getArticleBySlug(slug, locale);
  if (!article) return {};
  return buildPageMetadata({
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    path: `/articles/${article.slug}`,
    locale,
    // Falls back to the cover image when no OG override is set (brief item 32 — "Default:
    // use article featured image"), same as the article's own SEO fields defaulting to
    // title/excerpt when left blank.
    imageUrl: article.og_image?.file_url ?? article.cover_image?.file_url,
    type: "article",
    canonicalOverride: article.canonical_url,
  });
}

// FR-ART-02 — unique slug URL with its own SEO meta.
export default async function ArticleDetailPage({ params }: PageProps<"/[locale]/articles/[slug]">) {
  const { slug, locale } = await params;
  const [article, relatedArticles, dictionary] = await Promise.all([
    getArticleBySlug(slug, locale),
    // Unlike getArticleBySlug (requestOrNull), this throws on a 404 from the backend — an
    // invalid slug would otherwise reject the whole Promise.all before the `if (!article)`
    // check below ever runs, turning a should-be 404 into an uncaught 500.
    getRelatedArticles(slug, locale).catch(() => []),
    getDictionary(locale as Locale),
  ]);
  if (!article) notFound();

  return (
    <>
      <JsonLd data={articleJsonLd(article, locale)} />
      <ArticleDetailView
        article={article}
        relatedArticles={relatedArticles}
        locale={locale as Locale}
        dictionary={dictionary}
      />
    </>
  );
}
