import { Container } from "@ppn/ui-components";
import { Link } from "@/i18n/Link";

/**
 * Contact page's own premium dark hero — deliberately not the shared `PageHeader` (light
 * bg-neutral-100 banner used everywhere else) since the brief specifically asks for a
 * centered, dark, editorial hero here. No stock photo of a warehouse/container yard: PPN
 * hasn't supplied one, and inserting a generic stock image would violate this project's
 * standing "no generic imagery" rule — same dark gradient + glow treatment already used for
 * the Homepage Hero (docs/01-prd.md §13), built independently so Hero.tsx itself stays
 * untouched.
 */
export function ContactHero() {
  return (
    <section className="relative flex min-h-[42vh] items-center overflow-hidden bg-neutral-900">
      <div
        className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-900 to-primary-700/60"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, rgba(164,220,74,0.4), transparent 40%), radial-gradient(circle at 85% 70%, rgba(160,120,79,0.35), transparent 45%)",
        }}
        aria-hidden="true"
      />

      <Container className="relative z-10 py-20 text-center">
        <nav aria-label="Breadcrumb" className="flex justify-center">
          <ol className="flex items-center gap-2 text-small text-neutral-300">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-white">
              Contact
            </li>
          </ol>
        </nav>

        <p className="animate-fade-in-up mt-6 text-small font-medium uppercase tracking-wide text-primary-500">
          Contact Us
        </p>
        <h1 className="animate-fade-in-up mx-auto mt-3 max-w-2xl text-h1 text-white [animation-delay:80ms]">
          Let&apos;s Connect With Our Export Team
        </h1>
      </Container>
    </section>
  );
}
