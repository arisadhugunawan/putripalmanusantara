import { DEFAULT_LOCALE } from "@ppn/shared-types";
import { Container, Section, buttonVariants } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * docs/07-user-flow.md §9 — on-brand 404 with a CTA back to Products/Home.
 *
 * Always renders in English: `next/root-params` doesn't apply here (this app's root layout
 * intentionally sits outside app/[locale] so /admin can stay unprefixed, which makes
 * [locale] a nested param, not a root param), and `params` itself is unreliable for
 * not-found.tsx — confirmed empirically: it's `undefined` when Next renders this as a
 * fallback boundary during static generation of an unrelated page, not just on a real
 * unmatched URL. A locale-aware 404 isn't worth chasing that inconsistency for.
 */
export default async function NotFound() {
  const dict = await getDictionary(DEFAULT_LOCALE);

  return (
    <main>
      <Section>
        <Container className="flex flex-col items-center py-24 text-center">
          <p className="text-h1 text-primary-500">404</p>
          <h1 className="mt-2 text-h2 text-neutral-900">{dict.notFound.title}</h1>
          <p className="mt-3 max-w-md text-body-lg text-neutral-600">{dict.notFound.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className={buttonVariants("primary", "md")}>
              {dict.notFound.backHome}
            </Link>
            <Link href="/products" className={buttonVariants("secondary", "md")}>
              {dict.notFound.viewProducts}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
