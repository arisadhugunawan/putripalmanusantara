import { Container, buttonVariants, cn } from "@ppn/ui-components";
import Link from "next/link";

/**
 * FR-HOME-01 — video autoplay/muted/loop with poster fallback. No footage has been
 * provided yet (docs/01-prd.md §10.4 — client/production team supplies it later), so this
 * renders a static on-brand background rather than a broken/missing video element. Once
 * /hero-poster.jpg and /hero-video.webm exist in apps/web/public, swap in a <video> tag.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-end overflow-hidden bg-neutral-900">
      <div
        className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-900 to-primary-700/60"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(164,220,74,0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgba(160,120,79,0.35), transparent 45%)",
        }}
        aria-hidden="true"
      />

      <Container className="relative z-10 pb-16 pt-40 sm:pb-24">
        <p className="text-small font-medium uppercase tracking-wide text-primary-500">
          Indonesian Coconut Product Exporter
        </p>
        <h1 className="mt-3 max-w-3xl text-h1 text-white">
          Reliable coconut exports, from farm to your factory floor.
        </h1>
        <p className="mt-5 max-w-xl text-body-lg text-neutral-100/90">
          Semi Husked Coconut, Copra, Coconut Shell Charcoal, and Coconut Timber — sourced,
          processed, and shipped with consistent quality for buyers across Asia, the Middle
          East, and Europe.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="#request-quotation" className={buttonVariants("primary", "lg")}>
            Request Quotation
          </Link>
          <Link
            href="/products"
            className={cn(buttonVariants("secondary", "lg"), "border-white/40 text-white hover:border-white")}
          >
            View Products
          </Link>
        </div>
      </Container>
    </section>
  );
}
