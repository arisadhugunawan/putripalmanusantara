import type { HomepageHighlight, HomepageHighlightIcon } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";

const ICONS: Record<HomepageHighlightIcon, () => React.ReactNode> = {
  quality: QualityIcon,
  sustainability: SustainabilityIcon,
  partnership: PartnershipIcon,
  service: ServiceIcon,
  globe: GlobeIcon,
  award: AwardIcon,
};

/** About Preview section's 4 highlight cards — icon comes from a small built-in set
 * selected via the CMS `icon` key, not an upload. */
export function HighlightCards({ highlights }: { highlights: HomepageHighlight[] }) {
  if (highlights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {highlights.map((highlight) => {
        const Icon = ICONS[highlight.icon];
        return (
          <Card
            key={highlight.id}
            hoverable
            className="flex items-start gap-3 border border-neutral-100 bg-neutral-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-primary-50 text-primary-700">
              <Icon />
            </span>
            <span>
              <span className="block text-body font-medium text-neutral-900">{highlight.title}</span>
              <span className="mt-0.5 block text-small text-neutral-600">{highlight.description}</span>
            </span>
          </Card>
        );
      })}
    </div>
  );
}

const ICON_PROPS = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function QualityIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="m4 12.5 5 5L20 7" {...STROKE} />
    </svg>
  );
}

function SustainabilityIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 4c0 8.837-6.163 16-15 16-1 0-2-8 2-13S17 4 20 4Z" {...STROKE} />
      <path d="M5 20c3-5 6-8 11-12" {...STROKE} />
    </svg>
  );
}

function PartnershipIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="9" r="3" {...STROKE} />
      <circle cx="16" cy="9" r="3" {...STROKE} />
      <path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5" {...STROKE} />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 4h9.5A1.75 1.75 0 0 1 16 6.75v9.75M4 4v13.5c0 .83.67 1.5 1.5 1.5H18M4 4 2.5 2.5" {...STROKE} />
      <path d="M8 9h4M8 12.5h5" {...STROKE} />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" {...STROKE} />
      <path d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z" {...STROKE} />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8.5" r="5.5" {...STROKE} />
      <path d="m8.5 13-1.5 8 5-2.5 5 2.5-1.5-8" {...STROKE} />
    </svg>
  );
}
