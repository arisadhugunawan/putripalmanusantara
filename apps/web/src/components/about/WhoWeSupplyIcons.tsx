/** Icon set for "Who We Supply" — fixed allowlist (`WHO_WE_SUPPLY_ICONS`), matched one-to-one
 * with a small inline SVG each so Admin input can never inject markup. */

function GlobeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function FactoryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M3.5 20.5v-8l5-3v3l5-3v3l5-3v11H3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7 20.5v-4M12 20.5v-4M16.5 20.5v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="2.5" y="7" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M13.5 10h4l3 3v3h-7v-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function BuildingIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8.5 7.5h1.2M14.3 7.5h1.2M8.5 11.5h1.2M14.3 11.5h1.2M8.5 15.5h1.2M14.3 15.5h1.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10 20.5v-3h4v3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function HandshakeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="m2.5 12 3.8-3.8a2 2 0 0 1 2.83 0L12 11l2.87-2.8a2 2 0 0 1 2.83 0L21.5 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 12.5 2 2a1.6 1.6 0 0 0 2.3-2.2L10.8 9.8M13 14.5l1.3 1.3a1.6 1.6 0 0 0 2.3-2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<string, (props: { size?: number }) => React.ReactNode> = {
  globe: GlobeIcon,
  factory: FactoryIcon,
  truck: TruckIcon,
  building: BuildingIcon,
  handshake: HandshakeIcon,
};

export function WhoWeSupplyIcon({ icon, size = 22 }: { icon: string | null; size?: number }) {
  const Icon = icon ? ICONS[icon] : undefined;
  if (!Icon) return null;
  return <Icon size={size} />;
}
