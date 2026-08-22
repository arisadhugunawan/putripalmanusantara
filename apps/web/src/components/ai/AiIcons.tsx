/** Hand-drawn inline SVGs — same convention as every other icon set in this codebase
 * (`AdminNavIcons.tsx`, `FacilityIcons.tsx`, `contact/icons.tsx`): no icon library. */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

export function ChatBubbleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 5.5h16v10.5H9l-4 3.5v-3.5H4V5.5Z" {...STROKE} />
      <path d="M8 9.5h8M8 12.5h5" {...STROKE} />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" {...STROKE} />
    </svg>
  );
}

export function MinimizeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 14h12" {...STROKE} />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="m4 12 16-7-6.5 16-2.5-7-7-2Z" {...STROKE} />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 4.5c.5 2.6 1.4 4.4 2.6 5.4 1.2 1 3.1 1.7 5.9 2.1-2.8.4-4.7 1.1-5.9 2.1-1.2 1-2.1 2.8-2.6 5.4-.5-2.6-1.4-4.4-2.6-5.4-1.2-1-3.1-1.7-5.9-2.1 2.8-.4 4.7-1.1 5.9-2.1 1.2-1 2.1-2.8 2.6-5.4Z"
        {...STROKE}
      />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" {...STROKE} />
    </svg>
  );
}
