import { DECORATIVE_SVGS } from "@/components/decorative/DecorativeSvgs";

const LeafOutline = DECORATIVE_SVGS.leaf_outline;
const PalmLeaf = DECORATIVE_SVGS.palm_leaf;

/**
 * Section 13 — subtle low-opacity botanical background layer, reusing the project's existing
 * hand-authored decorative SVG set (`DecorativeSvgs.tsx`, same shapes the Article Detail page
 * uses) rather than a new asset. Fixed composition, not CMS-managed — same scope decision as
 * `ArticleDecorative.tsx`: this is background texture (2-5% opacity), not user-facing content,
 * so it doesn't need the Homepage's admin-configurable `DecorativeGraphic` system.
 */
export function ContactDecorative({
  className,
  tone = "light",
}: {
  className?: string;
  /** "light" (default) sits on white/cream sections, same colours `ArticleDecorative.tsx`
   * uses. "dark" sits on the deep-green hero — soft lime instead of the default dark greens,
   * which would otherwise be invisible against that background. */
  tone?: "light" | "dark";
}) {
  const leafColor = tone === "dark" ? "text-[#A8D85A]/[0.08]" : "text-primary-700/[0.04]";
  const palmColor = tone === "dark" ? "text-[#A8D85A]/[0.06]" : "text-accent-500/[0.05]";
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`} aria-hidden="true">
      <LeafOutline className={`animate-article-float absolute -left-14 top-0 h-64 w-64 sm:h-80 sm:w-80 ${leafColor}`} />
      <PalmLeaf className={`animate-article-float-slow absolute -right-10 bottom-0 h-56 w-56 sm:h-72 sm:w-72 ${palmColor}`} />
    </div>
  );
}
