import { Container, Section, buttonVariants, cn } from "@ppn/ui-components";
import type { Locale } from "@ppn/shared-types";
import type { Metadata } from "next";
import { Link } from "@/i18n/Link";
import { getArticleCategories, getArticles, getPageHeader } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { SafeImage } from "@/components/SafeImage";
import { PageHeader } from "@/components/page/PageHeader";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/articles">): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  return buildPageMetadata({
    title: dictionary.articles.pageTitle,
    description: dictionary.articles.metaDescription,
    path: "/articles",
    locale,
  });
}

const PAGE_SIZE = 9;

// FR-ART-01/02/03 — not a top-nav item (FR-ART-04); reached via Home or direct links.
export default async function ArticlesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/articles">) {
  const { locale } = await params;
  const { page: pageParam, category: categorySlug, q: qParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;
  const q = typeof qParam === "string" ? qParam : "";

  const [categories, headerConfig, dictionary] = await Promise.all([
    getArticleCategories(locale),
    getPageHeader("news", locale),
    getDictionary(locale as Locale),
  ]);
  const t = dictionary.articles;
  const activeCategory =
    typeof categorySlug === "string" ? categories.find((c) => c.slug === categorySlug) : undefined;

  // The hero only makes sense on an unfiltered first page — once the visitor has searched or
  // filtered, showing an unrelated "Featured" pick above their results would be confusing.
  const showHero = page === 1 && !q && !activeCategory;
  const [{ items: featuredItems }, { items, meta }] = await Promise.all([
    showHero
      ? getArticles(1, 1, locale, { featured: true })
      : Promise.resolve({ items: [], meta: null as never }),
    getArticles(page, PAGE_SIZE, locale, { q, categoryId: activeCategory?.id }),
  ]);
  const hero = featuredItems[0];
  const gridItems = hero ? items.filter((article) => article.id !== hero.id) : items;

  function pageHref(pageNumber: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorySlug && typeof categorySlug === "string") params.set("category", categorySlug);
    if (pageNumber > 1) params.set("page", String(pageNumber));
    const query = params.toString();
    return query ? `/articles?${query}` : "/articles";
  }

  return (
    <main>
      <PageHeader
        breadcrumb={[{ label: dictionary.nav.home, href: "/" }, { label: t.breadcrumbArticles }]}
        title={t.pageTitle}
        locale={locale}
        headerConfig={headerConfig}
      />

      {hero && (
        <Section spacing="compact" className="border-b border-neutral-100 bg-neutral-50">
          <Container>
            <Link
              href={`/articles/${hero.slug}`}
              className="group grid grid-cols-1 gap-6 overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card lg:grid-cols-2"
            >
              <div className="relative aspect-16/10 overflow-hidden lg:aspect-auto">
                <SafeImage
                  media={hero.cover_image}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-10">
                <p className="text-small font-medium uppercase tracking-wide text-primary-700">
                  {t.featuredBadge}{hero.category ? ` · ${hero.category.name}` : ""}
                </p>
                <h2 className="mt-2 text-h2 text-neutral-900">{hero.title}</h2>
                <p className="mt-3 text-body-lg text-neutral-600">{hero.excerpt}</p>
                <span className="mt-6 flex items-center gap-2 text-body font-medium text-primary-700">
                  {dictionary.home.articles.readArticleCta}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          </Container>
        </Section>
      )}

      <Section>
        <Container>
          <form action={`/${locale}/articles`} method="get" className="flex flex-wrap items-center gap-3">
            {categorySlug && typeof categorySlug === "string" && (
              <input type="hidden" name="category" value={categorySlug} />
            )}
            <label htmlFor="article-search" className="sr-only">
              {t.searchLabel}
            </label>
            <input
              id="article-search"
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="min-w-[16rem] flex-1 rounded-field border border-neutral-300 px-4 py-2.5 text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            />
            <button type="submit" className={buttonVariants("secondary", "md")}>
              {t.searchButton}
            </button>
          </form>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={q ? `/articles?q=${encodeURIComponent(q)}` : "/articles"}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-small font-medium transition-colors",
                  !activeCategory
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-primary-300 hover:text-primary-700",
                )}
              >
                {t.allCategoriesLabel}
              </Link>
              {categories.map((category) => {
                const params = new URLSearchParams({ category: category.slug });
                if (q) params.set("q", q);
                return (
                  <Link
                    key={category.id}
                    href={`/articles?${params}`}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-small font-medium transition-colors",
                      activeCategory?.id === category.id
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-primary-300 hover:text-primary-700",
                    )}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          )}

          {gridItems.length === 0 ? (
            <p className="mt-10 text-body text-neutral-600">
              {q || activeCategory ? t.noResultsMessage : t.noArticlesMessage}
            </p>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridItems.map((article) => (
                  <ArticleCard key={article.id} article={article} dictionary={dictionary} locale={locale as Locale} />
                ))}
              </div>

              {meta.total_pages > 1 && (
                <nav aria-label={t.paginationAriaLabel} className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={pageHref(pageNumber)}
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
