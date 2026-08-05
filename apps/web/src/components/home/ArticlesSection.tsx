import { Container, Section } from "@ppn/ui-components";
import type { ArticleSummary } from "@ppn/shared-types";
import { ArticleCard } from "@/components/articles/ArticleCard";

/**
 * FR-HOME-09 / FR-ART-01 — 3 latest articles. Not a top-nav menu item (FR-ART-04); this
 * section is the only public entry point besides direct article links.
 */
export function ArticlesSection({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <Section>
      <Container>
        <h2 className="text-h2 text-neutral-900">Insight & Articles</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
