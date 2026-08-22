import type { ShipmentIcon } from "@ppn/shared-types";

/** Hand-authored line icons for Shipment Terms (info cards, schedule steps, commitment cards)
 * — same zero-external-icon-library convention as `MoqPaymentIcons.tsx`/`SupplyNetworkIcons.tsx`
 * (1.5px stroke, 24x24 viewBox, currentColor). */
export const SHIPMENT_ICONS: Record<ShipmentIcon, (props: { className?: string }) => React.ReactNode> = {
  ship: ShipIcon,
  container: ContainerIcon,
  warehouse: WarehouseIcon,
  map_pin: MapPinIcon,
  globe: GlobeIcon,
  calendar: CalendarIcon,
  file_check: FileCheckIcon,
  package: PackageIcon,
  clipboard_check: ClipboardCheckIcon,
  route: RouteIcon,
};

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ShipIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 14.5h17l-2.5 5.5H6l-2.5-5.5Z" {...STROKE} />
      <path d="M6.5 14.5v-5h11v5" {...STROKE} />
      <path d="M9.5 9.5V5.5h2.5v4M14 9.5V6.5h2.5v3" {...STROKE} />
      <path d="M2 17.5c1.7 1 3.4 1 5.1 0s3.4-1 5.1 0 3.4 1 5.1 0 3.4-1 5.1 0" {...STROKE} />
    </svg>
  );
}

function ContainerIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="1" {...STROKE} />
      <path d="M8 6.5v11M13 6.5v11M3.5 12h17" {...STROKE} />
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12Z" {...STROKE} />
      <circle cx="12" cy="9" r="2.5" {...STROKE} />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z" {...STROKE} />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" {...STROKE} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" {...STROKE} />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" {...STROKE} />
      <path d="M14 3.5V8h4" {...STROKE} />
      <path d="M9 13.5l2 2 4-4.5" {...STROKE} />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" {...STROKE} />
      <path d="M4 8l8 4.5L20 8M12 12.5V21" {...STROKE} />
    </svg>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="5.5" y="4.5" width="13" height="17" rx="1.5" {...STROKE} />
      <path d="M9 4.5V3.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 3.8v.7" {...STROKE} />
      <path d="M9 13l2 2 4-4.5" {...STROKE} />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="5.5" cy="6" r="2" {...STROKE} />
      <circle cx="18.5" cy="18" r="2" {...STROKE} />
      <path d="M5.5 8v2a4 4 0 0 0 4 4h5a4 4 0 0 1 4 4" {...STROKE} strokeDasharray="1 4" />
    </svg>
  );
}
