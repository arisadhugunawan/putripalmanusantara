import { Container, Section, buttonVariants, cn } from "@ppn/ui-components";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";
import { getArticles } from "@/lib/api";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/articles">): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "Insight & Articles",
    description: "Industry insight and updates from CV Putri Palma Nusantara.",
    path: "/articles",
    locale,
  });
}

// FR-ART-01/02/03 — not a top-nav item (FR-ART-04); reached via Home or direct links.
export default async function ArticlesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/articles">) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
  const { items, meta } = await getArticles(page, 9, locale);

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Articles" }]}
        title="Insight & Articles"
        locale={locale}
      />
      <Section>
        <Container>
          {items.length === 0 ? (
            <p className="text-body text-neutral-600">No articles published yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {meta.total_pages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={pageNumber === 1 ? "/articles" : `/articles?page=${pageNumber}`}
                      className={cn(
                        buttonVariants(pageNumber === page ? "primary" : "secondary", "sm"),
                        "min-w-11",
                      )}
                    >
                      {pageNumber}
                    </Link>
                  ))}
                </nav>
              )}
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}
