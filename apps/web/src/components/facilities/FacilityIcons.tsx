/**
 * One distinct line icon per fixed master facility, keyed by `Facility.slug` — hand-authored
 * (this codebase never pulls in an icon library, see README "Zero external icon/animation
 * library convention"), 24×24 viewBox, stroke-based to match the rest of this app's functional
 * UI icons (e.g. `GalleryLightbox.tsx`'s toolbar icons), distinct from the decorative watermark
 * style in `DecorativeSvgs.tsx`.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

function WarehouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5" {...STROKE} />
      <path d="M4.5 9.5V20h15V9.5" {...STROKE} />
      <path d="M9.5 20v-6h5v6" {...STROKE} />
    </svg>
  );
}

function WeighbridgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 4v16M7 20h10" {...STROKE} />
      <path d="M4 7h16" {...STROKE} />
      <path d="M4 7 2 11.5a2.5 2.5 0 0 0 5 0L4 7ZM20 7l-2 4.5a2.5 2.5 0 0 0 5 0L20 7Z" {...STROKE} />
    </svg>
  );
}

function ForkliftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="6" cy="19" r="1.6" {...STROKE} />
      <circle cx="16" cy="19" r="1.6" {...STROKE} />
      <path d="M6 17.5h6V9M12 17.5h6v-4h-3" {...STROKE} />
      <path d="M18 6v11.5M18 8h3v3h-3" {...STROKE} />
      <path d="M6 9h1.5L9 4" {...STROKE} />
    </svg>
  );
}

function LoadingUnloadingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 4v9M4 9.5 7 13l3-3.5" {...STROKE} />
      <path d="M17 20v-9M14 14.5 17 11l3 3.5" {...STROKE} />
    </svg>
  );
}

function SortingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 5h16L14 13v6l-4 2v-8L4 5Z" {...STROKE} />
    </svg>
  );
}

function QualityControlIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" {...STROKE} />
      <path d="m9 12 2 2 4-4.5" {...STROKE} />
    </svg>
  );
}

function PackingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 8 12 4l8 4-8 4-8-4Z" {...STROKE} />
      <path d="M4 8v9l8 4 8-4V8M12 12v9" {...STROKE} />
    </svg>
  );
}

function TruckContainerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M2.5 7.5h11v9h-11z" {...STROKE} />
      <path d="M13.5 10.5H17l3.5 3v3h-7z" {...STROKE} />
      <circle cx="6.5" cy="18" r="1.6" {...STROKE} />
      <circle cx="17" cy="18" r="1.6" {...STROKE} />
    </svg>
  );
}

function InventoryStorageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="13" width="7" height="7" rx="0.8" {...STROKE} />
      <rect x="14" y="13" width="7" height="7" rx="0.8" {...STROKE} />
      <rect x="8.5" y="4" width="7" height="7" rx="0.8" {...STROKE} />
    </svg>
  );
}

function OperationalOfficeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="0.8" {...STROKE} />
      <path d="M8.5 7.5h2M13.5 7.5h2M8.5 11.5h2M13.5 11.5h2M8.5 15.5h2M13.5 15.5h2" {...STROKE} />
    </svg>
  );
}

export const FACILITY_ICONS: Record<string, (props: IconProps) => React.ReactNode> = {
  "large-capacity-warehouse": WarehouseIcon,
  "weighbridge-20-40ft": WeighbridgeIcon,
  "forklift-material-handling": ForkliftIcon,
  "loading-unloading-area": LoadingUnloadingIcon,
  "product-sorting-area": SortingIcon,
  "quality-control-area": QualityControlIcon,
  "packing-preparation-area": PackingIcon,
  "truck-container-access": TruckContainerIcon,
  "inventory-storage-management": InventoryStorageIcon,
  "operational-administration-office": OperationalOfficeIcon,
};

/** Falls back to a generic building glyph for any slug not in the fixed master list — should
 * never happen in practice, but keeps the UI honest instead of rendering nothing. */
export function FacilityIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = FACILITY_ICONS[slug] ?? OperationalOfficeIcon;
  return <Icon className={className} />;
}
