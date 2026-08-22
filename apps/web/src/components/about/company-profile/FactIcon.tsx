/**
 * Company Facts icons. A fixed allowlist keyed by the string the Admin picked — Admin input
 * never becomes markup or a remote asset URL, and an unknown/blank key simply renders nothing
 * rather than a broken glyph.
 */
const PATHS: Record<string, React.ReactNode> = {
  building: (
    <>
      <path d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15" />
      <path d="M14 10h5a1 1 0 0 1 1 1v10" />
      <path d="M7 9h4M7 13h4M7 17h4M17 14h1M17 18h1" />
      <path d="M2 21h20" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20c0-8 6-14 16-14 0 10-6 15-13 15H4v-1Z" />
      <path d="M9 16c2-4 5-6 9-7" />
    </>
  ),
  package: (
    <>
      <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  ship: (
    <>
      <path d="M3 18c1.8 0 1.8 1.5 3.6 1.5S8.4 18 10.2 18s1.8 1.5 3.6 1.5S15.6 18 17.4 18s1.8 1.5 3.6 1.5" />
      <path d="M4.5 15 6 9h12l1.5 6" />
      <path d="M12 9V5M9 5h6" />
    </>
  ),
  phone: (
    <path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
};

export function FactIcon({ icon, className }: { icon: string | null; className?: string }) {
  const path = icon ? PATHS[icon] : null;
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
