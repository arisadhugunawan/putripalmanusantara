import { Container, Section } from "@ppn/ui-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/api";
import { PageHeader } from "@/components/page/PageHeader";
import { SafeImage } from "@/components/SafeImage";

export async function generateStaticParams() {
  const { items } = await getArticles(1, 100);
  return items.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.meta_title || `${article.title} | CV Putri Palma Nusantara`,
    description: article.meta_description || article.excerpt,
  };
}

// FR-ART-02 — unique slug URL with its own SEO meta.
export default async function ArticleDetailPage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const date = new Date(article.published_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main>
      <PageHeader
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: article.title },
        ]}
        title={article.title}
        description={`${article.author} · ${date}`}
      />
      <Section>
        <Container className="max-w-3xl">
          <div className="relative mb-10 aspect-16/9 overflow-hidden rounded-card">
            <SafeImage media={article.cover_image} />
          </div>
          <div
            className="prose max-w-none text-body-lg text-neutral-600 [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </Container>
      </Section>
    </main>
  );
}
