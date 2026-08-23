"use client";

import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { useEffect } from "react";
import { Link } from "@/i18n/Link";

/**
 * Root-segment error boundary (P0.4-A). Its one job is catching a throw from
 * app/[locale]/layout.tsx — a nested layout below the true app root, which error.js DOES wrap
 * (it only excludes the layout at its OWN segment, app/layout.tsx). This is the intended
 * backstop for that specific layout; the .catch() fallbacks added to its data fetches should
 * mean this rarely if ever renders in practice.
 *
 * Error boundaries must be Client Components and cannot call async server data (like
 * getDictionary) — kept intentionally minimal and English-only rather than adding new
 * client-side dictionary-loading logic for a rarely-seen fallback screen. Renders inside the
 * root layout's existing <html>/<body> (unlike global-error.tsx), so the shared stylesheet is
 * already loaded and Tailwind classes render normally.
 */
export default function RootError({
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
            We couldn&apos;t load this page right now. Please try again in a moment.
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
