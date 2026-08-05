import { Card } from "@ppn/ui-components";
import type { ArticleSummary } from "@ppn/shared-types";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  const date = new Date(article.published_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/articles/${article.slug}`} className="block h-full">
      <Card hoverable className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-16/10">
          <SafeImage media={article.cover_image} sizes="(min-width: 1024px) 33vw, 100vw" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          {article.category && (
            <p className="text-small font-medium uppercase tracking-wide text-primary-700">
              {article.category}
            </p>
          )}
          <h3 className="mt-1 text-h3 text-neutral-900">{article.title}</h3>
          <p className="mt-2 flex-1 text-body text-neutral-600">{article.excerpt}</p>
          <p className="mt-4 text-small text-neutral-600">{date}</p>
        </div>
      </Card>
    </Link>
  );
}
