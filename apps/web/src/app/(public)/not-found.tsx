import { Container, Section, buttonVariants } from "@ppn/ui-components";
import Link from "next/link";

// docs/07-user-flow.md §9 — on-brand 404 with a CTA back to Products/Home.
export default function NotFound() {
  return (
    <main>
      <Section>
        <Container className="flex flex-col items-center py-24 text-center">
          <p className="text-h1 text-primary-500">404</p>
          <h1 className="mt-2 text-h2 text-neutral-900">Page not found</h1>
          <p className="mt-3 max-w-md text-body-lg text-neutral-600">
            The page you&apos;re looking for may have been moved or is no longer available.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className={buttonVariants("primary", "md")}>
              Back to Home
            </Link>
            <Link href="/products" className={buttonVariants("secondary", "md")}>
              View Products
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
