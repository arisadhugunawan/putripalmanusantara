/** Sack silhouette — a shared outline distinguished by fill tone/pattern rather than three
 * unrelated icon shapes, so a row of packaging chips/cards reads as one cohesive family. Used
 * as the fallback visual (PackagingCards, DeliveryPackagingFooter) when a packaging entry has
 * no uploaded photo yet. */
export function PackagingIcon({ pattern }: { pattern: "weave" | "solid" | "mesh" }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <defs>
        <pattern id={`weave-${pattern}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </pattern>
        <pattern id={`mesh-${pattern}`} width="3.5" height="3.5" patternUnits="userSpaceOnUse">
          <circle cx="1.75" cy="1.75" r="0.6" fill="currentColor" opacity="0.55" />
        </pattern>
      </defs>
      <path
        d="M7 3h10l1.4 6.2c.6 2.6.9 5.3.9 8a3 3 0 0 1-3 3H7.7a3 3 0 0 1-3-3c0-2.7.3-5.4.9-8L7 3Z"
        fill={pattern === "weave" ? `url(#weave-${pattern})` : pattern === "mesh" ? `url(#mesh-${pattern})` : "currentColor"}
        fillOpacity={pattern === "solid" ? 0.16 : 1}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 3c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Chooses a packaging icon variant by matching keywords in the (real, CMS-authored) title —
 * same convention as ApplicationCards' `iconFor()`. Only the visual pattern is cosmetic; the
 * title/description text is always the real CMS content. */
export function packagingIconPatternFor(title: string): "weave" | "solid" | "mesh" {
  const t = title.toLowerCase();
  if (/jute|gunny|burlap|hessian/.test(t)) return "weave";
  if (/net|mesh/.test(t)) return "mesh";
  return "solid";
}
