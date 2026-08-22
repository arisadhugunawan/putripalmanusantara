import type { ProductionStepIcon } from "@ppn/shared-types";

/**
 * Hand-authored line icons for the "Our Supply & Export Process" flowchart — same
 * zero-external-icon-library convention as WhyChooseUsIcons.tsx/HighlightCards.tsx (no
 * Lucide/Font Awesome dependency). Consistent 1.5px stroke weight, 24x24 viewBox,
 * currentColor so the PPN accent tone is set by the wrapping element.
 */
export const PRODUCTION_STEP_ICONS: Record<ProductionStepIcon, (props: { className?: string }) => React.ReactNode> = {
  sourcing: SourcingIcon,
  warehouse: WarehouseIcon,
  quality: QualityIcon,
  packaging: PackagingIcon,
  logistics: LogisticsIcon,
  documents: DocumentsIcon,
  shipping: ShippingIcon,
};

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function SourcingIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 21c4-2.5 6.5-6 6.5-10.2C18.5 6.8 15.6 4 12 3c-3.6 1-6.5 3.8-6.5 7.8C5.5 15 8 18.5 12 21Z" {...STROKE} />
      <path d="M12 21v-8.5" {...STROKE} />
      <path d="M12 12.5c0-2.4 1.1-4 3-5.3" {...STROKE} />
      <path d="M12 12.5c0-2.4-1.1-4-3-5.3" {...STROKE} />
    </svg>
  );
}

function WarehouseIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 10.5 12 4l9 6.5" {...STROKE} />
      <path d="M4.5 9.5V20h15V9.5" {...STROKE} />
      <path d="M9.5 20v-6h5v6" {...STROKE} />
      <path d="M4.5 14.5h3M16.5 14.5h3" {...STROKE} />
    </svg>
  );
}

function QualityIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 3.5 19 6.5V12c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5V6.5l7-3Z" {...STROKE} />
      <path d="m9 12 2.2 2.2L15.5 9.7" {...STROKE} />
    </svg>
  );
}

function PackagingIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Z" {...STROKE} />
      <path d="M3.5 8 12 12.5 20.5 8" {...STROKE} />
      <path d="M12 12.5v8" {...STROKE} />
      <path d="M16.3 5.7 7.7 10.3" {...STROKE} />
    </svg>
  );
}

function LogisticsIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 6.5h10v8.5H3z" {...STROKE} />
      <path d="M13 10h4l3.5 3.5v1.5H13" {...STROKE} />
      <circle cx="7" cy="17.5" r="1.7" {...STROKE} />
      <circle cx="17" cy="17.5" r="1.7" {...STROKE} />
    </svg>
  );
}

function DocumentsIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M6.5 3.5h8l4 4v13a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" {...STROKE} />
      <path d="M14.5 3.5V8h4" {...STROKE} />
      <path d="M8.5 12.5h7M8.5 15.8h7M8.5 19h4" {...STROKE} />
    </svg>
  );
}

function ShippingIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4 11.5 12 8l8 3.5-8 3.5-8-3.5Z" {...STROKE} />
      <path d="M4 11.5v5.7L12 20l8-2.8v-5.7" {...STROKE} />
      <path d="M12 15v5" {...STROKE} />
      <path d="M8 9.7V6.5h8v3.2" {...STROKE} />
    </svg>
  );
}
