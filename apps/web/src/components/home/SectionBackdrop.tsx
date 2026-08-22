import { cn } from "@ppn/ui-components";

/**
 * Shared dot-grid + blurred gradient-orb backdrop — extracted from the pattern
 * `SupplyNetworkSection.tsx`/`ProcessSection.tsx` established for this homepage's three
 * "showcase" sections, so every section reusing it reads as one consistent visual family
 * (brief: "variation is allowed while maintaining consistency") instead of six one-off
 * treatments. `orbSide` mirrors the orb pair so adjacent sections can alternate which corner
 * feels "anchored", avoiding a repetitive top-right/bottom-left rhythm down the page.
 */
export function SectionBackdrop({ orbSide = "right" }: { orbSide?: "left" | "right" }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(74,101,30,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl",
          orbSide === "right" ? "-right-32" : "-left-32",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl",
          orbSide === "right" ? "-left-32" : "-right-32",
        )}
      />
    </>
  );
}
