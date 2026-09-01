import type { ContactPageSettings } from "@ppn/shared-types";
import { Container } from "@ppn/ui-components";
import Image from "next/image";
import { Breadcrumb } from "@/components/page/Breadcrumb";
import { ContactDecorative } from "./ContactDecorative";

/**
 * Premium Contact hero — deep natural green (#183D2B → #245C3A), the PPN brand identity this
 * redesign brief asks for, fully Admin-editable (eyebrow/heading/description/background image/
 * overlay strength — see Admin → Pengaturan → Kontak). A real client photo (when uploaded) sits
 * under a green-tinted overlay rather than the near-black treatment the brief explicitly asked
 * to avoid, so text stays legible without the hero reading as a generic dark stock-photo
 * banner. Colours here are Contact-page-local (arbitrary Tailwind values, not new global
 * tokens) — the rest of the site's own green (`primary-500` etc.) is untouched.
 *
 * Deliberately no badges or CTA buttons here (removed per user request to declutter) — every
 * conversion path (WhatsApp/Email/Location) still lives one scroll away in the Contact Action
 * Hub immediately below, plus the sticky mobile bar / floating WhatsApp button.
 */
export function ContactHero({
  settings,
  navHomeLabel,
  navContactLabel,
}: {
  settings: ContactPageSettings;
  navHomeLabel: string;
  navContactLabel: string;
}) {
  const overlayOpacity = Math.min(100, Math.max(0, settings.hero_overlay_opacity)) / 100;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(155deg,#183D2B_0%,#1F4A34_45%,#245C3A_100%)]">
      {settings.hero_image && (
        <div className="animate-[article-hero-reveal_1.1s_cubic-bezier(0.22,1,0.36,1)_both] absolute inset-0">
          <Image src={settings.hero_image.file_url} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#183D2B]" style={{ opacity: overlayOpacity }} aria-hidden="true" />
        </div>
      )}
      {!settings.hero_image && <ContactDecorative tone="dark" />}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(168,216,90,0.25), transparent 45%), radial-gradient(circle at 85% 80%, rgba(111,175,58,0.2), transparent 45%)",
        }}
        aria-hidden="true"
      />

      <Container className="relative py-20 text-center lg:py-28">
        <div className="flex justify-center">
          <Breadcrumb
            items={[{ label: navHomeLabel, href: "/" }, { label: navContactLabel }]}
            color="#ffffff"
          />
        </div>

        {settings.hero_eyebrow && (
          <p className="animate-fade-in-up mt-7 text-small font-semibold tracking-[0.16em] text-[#A8D85A] uppercase">
            {settings.hero_eyebrow}
          </p>
        )}
        <h1 className="animate-fade-in-up mx-auto mt-4 max-w-3xl text-h1 text-white [animation-delay:80ms]">
          {settings.hero_heading}
        </h1>
        {settings.hero_description && (
          <p className="animate-fade-in-up mx-auto mt-5 max-w-xl text-body-lg text-white/75 [animation-delay:160ms]">
            {settings.hero_description}
          </p>
        )}
      </Container>
    </section>
  );
}
