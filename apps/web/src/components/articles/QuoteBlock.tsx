/** Brief item 22 — premium pull-quote, Admin-controlled (`Article.quote_text`/`quote_author`). */
export function QuoteBlock({ text, author }: { text: string | null; author: string | null }) {
  if (!text) return null;

  return (
    <blockquote className="my-10 border-l-4 border-primary-500 bg-neutral-50 py-6 pl-6 pr-4 sm:py-8 sm:pl-8">
      <p className="text-h3 leading-snug text-neutral-900">&ldquo;{text}&rdquo;</p>
      {author && <footer className="mt-3 text-small text-neutral-600">— {author}</footer>}
    </blockquote>
  );
}
