"use client";

import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { useEffect } from "react";
import { Link } from "@/i18n/Link";

/**
 * Page-level error boundary (P0.4-A) — wraps page.tsx and any nested route below this
 * segment, but NOT this segment's own layout.tsx (Next's error.js semantics: a boundary
 * never catches errors thrown by the layout at its own segment level). In practice this
 * means Header/Footer, rendered by [locale]/layout.tsx above this boundary, stay intact
 * and navigable even when a single page (e.g. a Product detail page) fails to render.
 *
 * Error boundaries must be Client Components and cannot call async server data (like
 * getDictionary) — kept intentionally minimal and English-only rather than adding new
 * client-side dictionary-loading logic for a rarely-seen fallback screen.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <Section>
        <Container className="flex flex-col items-center py-24 text-center">
          <p className="text-h1 text-primary-500">Oops</p>
          <h1 className="mt-2 text-h2 text-neutral-900">Something went wrong</h1>
          <p className="mt-3 max-w-md text-body-lg text-neutral-600">
            This page couldn&apos;t be displayed. Please try again, or head back to the homepage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => retry()} className={buttonVariants("primary", "md")}>
              Try again
            </button>
            <Link href="/" className={buttonVariants("secondary", "md")}>
              Back to homepage
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
