import type { HomepageWhyChooseUsIcon } from "@ppn/shared-types";

/**
 * Hand-authored line icons for the "Why Choose Us?" cards — same zero-external-icon-library
 * convention as HighlightCards.tsx/DecorativeSvgs.tsx (no Lucide/Font Awesome dependency).
 * Consistent 1.5px stroke weight, 24x24 viewBox, currentColor so the PPN dark-green tone is
 * set by the wrapping element.
 */
export const WHY_CHOOSE_US_ICONS: Record<HomepageWhyChooseUsIcon, (props: { className?: string }) => React.ReactNode> = {
  quality: QualityIcon,
  supply: SupplyIcon,
  export_ready: ExportReadyIcon,
  consistency: ConsistencyIcon,
  sustainability: SustainabilityIcon,
  service: ServiceIcon,
  pricing: PricingIcon,
  delivery: DeliveryIcon,
};

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function QualityIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 3.5 19 6.5V12c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5V6.5l7-3Z" {...STROKE} />
      <path d="m9 12 2.2 2.2L15.5 9.7" {...STROKE} />
    </svg>
  );
}

function SupplyIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" {...STROKE} />
      <path d="M3 8.5v8L12 21l9-4.5v-8" {...STROKE} />
      <path d="M12 13v8" {...STROKE} />
    </svg>
  );
}

function ExportReadyIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="10.5" cy="13.5" r="6.5" {...STROKE} />
      <path d="M4 13.5h13" {...STROKE} />
      <path d="M10.5 7c1.7 1.7 2.5 3.9 2.5 6.5s-.8 4.8-2.5 6.5c-1.7-1.7-2.5-3.9-2.5-6.5S8.8 8.7 10.5 7Z" {...STROKE} />
      <path d="M15.5 4h4.5v4.5" {...STROKE} />
      <path d="M20 4 14.5 9.5" {...STROKE} />
    </svg>
  );
}

function ConsistencyIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="m8.3 12.3 2.5 2.5 5-5.2" {...STROKE} />
    </svg>
  );
}

function SustainabilityIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M19.5 4.5c0 8.28-5.77 15-14.5 15-.94 0-1.87-7.5 1.88-12.19S16.8 4.5 19.5 4.5Z" {...STROKE} />
      <path d="M5.5 19c2.8-4.7 5.6-7.5 10.3-11.25" {...STROKE} />
    </svg>
  );
}

function ServiceIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4.5 13a7.5 7.5 0 0 1 15 0" {...STROKE} />
      <rect x="3" y="13" width="4" height="6.5" rx="1.6" {...STROKE} />
      <rect x="17" y="13" width="4" height="6.5" rx="1.6" {...STROKE} />
      <path d="M19 15.8v1.7a3.5 3.5 0 0 1-3.5 3.5h-2.6" {...STROKE} />
    </svg>
  );
}

function PricingIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M11.3 3.5H4.5v6.8L14 20l6.5-6.5-9.5-10Z" {...STROKE} />
      <circle cx="8" cy="7.5" r="1.4" {...STROKE} />
    </svg>
  );
}

function DeliveryIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 6.5h10v8.5H3z" {...STROKE} />
      <path d="M13 10h4l3.5 3.5v1.5H13" {...STROKE} />
      <circle cx="7" cy="17.5" r="1.7" {...STROKE} />
      <circle cx="17" cy="17.5" r="1.7" {...STROKE} />
    </svg>
  );
}
