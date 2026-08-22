/** One distinct line icon per top-level Admin nav group — 20×20 viewBox, hand-authored, same
 * stroke-icon convention as `FacilityIcons.tsx`/`SupplyNetworkIcons.tsx` (no icon library
 * anywhere in this app). */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M3 9.5 10 4l7 5.5" {...STROKE} />
      <path d="M4.5 8.5V17h11V8.5" {...STROKE} />
      <path d="M8 17v-5h4v5" {...STROKE} />
    </svg>
  );
}

export function AboutCompanyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="4" y="3" width="12" height="14" rx="0.8" {...STROKE} />
      <path d="M7 7h2M11 7h2M7 10h2M11 10h2M7 13h2M11 13h2" {...STROKE} />
    </svg>
  );
}

export function ProductsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M3.5 6.5 10 3l6.5 3.5-6.5 3.5-6.5-3.5Z" {...STROKE} />
      <path d="M3.5 6.5v7L10 17l6.5-3.5v-7M10 10v7" {...STROKE} />
    </svg>
  );
}

export function FacilitiesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M2.5 9 10 3.5 17.5 9" {...STROKE} />
      <path d="M4 8v9h12V8" {...STROKE} />
      <path d="M8 17v-5h4v5" {...STROKE} />
    </svg>
  );
}

export function GalleryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1" {...STROKE} />
      <circle cx="7.5" cy="8" r="1.3" {...STROKE} />
      <path d="m4 14 3.5-4 3 3 2-2.5 3.5 4.5" {...STROKE} />
    </svg>
  );
}

export function NewsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1" {...STROKE} />
      <path d="M6 7.5h5M6 10h8M6 12.5h8" {...STROKE} />
    </svg>
  );
}

export function ContactIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="11" rx="1.2" {...STROKE} />
      <path d="m3.5 5.5 6.5 5 6.5-5" {...STROKE} />
    </svg>
  );
}

export function MediaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="3" y="3" width="12" height="10" rx="1" {...STROKE} />
      <rect x="5.5" y="6" width="12" height="10" rx="1" className="fill-white" {...STROKE} />
      <circle cx="9" cy="9.5" r="1" {...STROKE} />
      <path d="m6.5 14 2.5-2.5 2 2 3-3 2 2" {...STROKE} />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" {...STROKE} />
      <path
        d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"
        {...STROKE}
      />
    </svg>
  );
}

export function CertificateIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="7.5" r="4.5" {...STROKE} />
      <path d="m8 11.5-1 6 3-1.8 3 1.8-1-6" {...STROKE} />
      <path d="m8 7.5 1.3 1.3L12.5 6" {...STROKE} />
    </svg>
  );
}

export function InquiryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M3 4.5h14v9H8.5L5 16.5v-3H3v-9Z" {...STROKE} />
      <path d="M6.5 8h7M6.5 10.5h4" {...STROKE} />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7" {...STROKE} />
      <path d="M3 10h14M10 3c2 2 3 4.5 3 7s-1 5-3 7c-2-2-3-4.5-3-7s1-5 3-7Z" {...STROKE} />
    </svg>
  );
}

export function TrendUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="m3 13 5-5 3 3 6-6" {...STROKE} />
      <path d="M13 5h4v4" {...STROKE} />
    </svg>
  );
}

export function AiAssistantIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M10 3c.4 2.1 1.2 3.6 2.2 4.5.9.9 2.4 1.6 4.6 2-2.2.4-3.7 1.1-4.6 2-1 1-1.8 2.4-2.2 4.5-.4-2.1-1.2-3.6-2.2-4.5-.9-.9-2.4-1.6-4.6-2 2.2-.4 3.7-1.1 4.6-2C8.8 6.6 9.6 5.1 10 3Z"
        {...STROKE}
      />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" {...STROKE} />
    </svg>
  );
}

/** Sidebar collapse/expand toggle — a panel with a divider, matching the common "collapse rail"
 * affordance used by VS Code/Notion-style sidebars. */
export function SidebarCollapseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" {...STROKE} />
      <path d="M8 4v12" {...STROKE} />
    </svg>
  );
}

export function ActivityLogIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M10 4a6.5 6.5 0 1 1-6.5 6.5" {...STROKE} />
      <path d="M3.5 4.5v3h3" {...STROKE} />
      <path d="M10 7v3.5l2.5 1.5" {...STROKE} />
    </svg>
  );
}
