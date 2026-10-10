/**
 * A small, fixed icon set for the "info block" pattern in article statistics (Product /
 * Shipment / Destination / Quantity / Date / Contact) — hand-authored, 24×24 viewBox,
 * stroke-based, matching every other functional icon in this app (e.g. `FacilityIcons.tsx`;
 * see README "Zero external icon/animation library convention" — this project never installs
 * an icon package). Icons are opt-in per stat (Admin picks one from this fixed list, or none),
 * never a free-form emoji/URL, so pasted Instagram emoji can never dictate the article's layout
 * or size.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

function ProductIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" {...STROKE} />
      <path d="M4 8l8 4.5L20 8M12 12.5V21" {...STROKE} />
    </svg>
  );
}

function ShipmentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 8.5h11v8H3zM14 11h4l3 3v2.5h-7z" {...STROKE} />
      <circle cx="7" cy="18.5" r="1.6" {...STROKE} />
      <circle cx="17.5" cy="18.5" r="1.6" {...STROKE} />
    </svg>
  );
}

function DestinationIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" {...STROKE} />
      <circle cx="12" cy="9.5" r="2.3" {...STROKE} />
    </svg>
  );
}

function QuantityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="0.8" {...STROKE} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="0.8" {...STROKE} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="0.8" {...STROKE} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="0.8" {...STROKE} />
    </svg>
  );
}

function DateIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="16" rx="1.2" {...STROKE} />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" {...STROKE} />
    </svg>
  );
}

function ContactIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 5.5h16v13H4zM4 6l8 6.5L20 6" {...STROKE} />
    </svg>
  );
}

export const ARTICLE_STAT_ICONS: Record<string, (props: IconProps) => React.ReactNode> = {
  product: ProductIcon,
  shipment: ShipmentIcon,
  destination: DestinationIcon,
  quantity: QuantityIcon,
  date: DateIcon,
  contact: ContactIcon,
};

export const ARTICLE_STAT_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No icon" },
  { value: "product", label: "Product" },
  { value: "shipment", label: "Shipment" },
  { value: "destination", label: "Destination" },
  { value: "quantity", label: "Quantity" },
  { value: "date", label: "Date" },
  { value: "contact", label: "Contact" },
];

/** Renders nothing when `icon` is unset/unrecognized — the label+value still reads fine on its
 * own, so a missing icon is never a broken/placeholder state. */
export function ArticleStatIcon({ icon, className }: { icon?: string | null; className?: string }) {
  if (!icon) return null;
  const Icon = ARTICLE_STAT_ICONS[icon];
  if (!Icon) return null;
  return <Icon className={className} />;
}
