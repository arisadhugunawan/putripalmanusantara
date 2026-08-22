import type { SupplyNetworkIcon } from "@ppn/shared-types";

/** One distinct line icon per supply-network node type, matching the stroke-icon convention
 * established in `FacilityIcons.tsx` — 24×24 viewBox, hand-authored (no icon library). */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

function FarmerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="6" r="2.4" {...STROKE} />
      <path d="M8 20v-5.5a4 4 0 0 1 8 0V20" {...STROKE} />
      <path d="M4.5 20h15M6 20v-3.5M18 20v-3.5" {...STROKE} />
    </svg>
  );
}

function CollectorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 10h16l-1.6 9.5a1.5 1.5 0 0 1-1.5 1.5H7.1a1.5 1.5 0 0 1-1.5-1.5L4 10Z" {...STROKE} />
      <path d="M4 10 7 4h10l3 6M9 10v-2M15 10v-2" {...STROKE} />
    </svg>
  );
}

function SupplierIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5" {...STROKE} />
      <path d="M4.5 9.5V20h15V9.5" {...STROKE} />
      <circle cx="12" cy="15" r="2" {...STROKE} />
    </svg>
  );
}

function WarehouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5" {...STROKE} />
      <path d="M4.5 9.5V20h15V9.5" {...STROKE} />
      <path d="M9.5 20v-6h5v6" {...STROKE} />
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

function LoadingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="6" cy="19" r="1.6" {...STROKE} />
      <circle cx="16" cy="19" r="1.6" {...STROKE} />
      <path d="M6 17.5h6V9M12 17.5h6v-4h-3" {...STROKE} />
      <path d="M18 6v11.5M18 8h3v3h-3" {...STROKE} />
    </svg>
  );
}

function ContainerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1" {...STROKE} />
      <path d="M3 10h18M3 14h18M8 6v12M14 6v12" {...STROKE} />
    </svg>
  );
}

function ShippingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 12V6h6l3 3h4l1 3" {...STROKE} />
      <path d="M3 12h18l-2 5.5H6.5L3 12Z" {...STROKE} />
      <path d="M8 20c1.5 1 2.5 1 4 0s2.5-1 4 0" {...STROKE} />
    </svg>
  );
}

function GlobalBuyerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z" {...STROKE} />
    </svg>
  );
}

export const SUPPLY_NETWORK_ICONS: Record<SupplyNetworkIcon, (props: IconProps) => React.ReactNode> = {
  farmer: FarmerIcon,
  collector: CollectorIcon,
  supplier: SupplierIcon,
  warehouse: WarehouseIcon,
  quality_control: QualityControlIcon,
  packing: PackingIcon,
  loading: LoadingIcon,
  container: ContainerIcon,
  shipping: ShippingIcon,
  global_buyer: GlobalBuyerIcon,
};

export function SupplyNetworkNodeIcon({ icon, className }: { icon: SupplyNetworkIcon; className?: string }) {
  const Icon = SUPPLY_NETWORK_ICONS[icon] ?? GlobalBuyerIcon;
  return <Icon className={className} />;
}
