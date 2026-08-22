/** Hand-authored line icons for the Facilities FAQ — same zero-external-icon-library
 * convention as every other icon file this session (1.5px stroke, 24x24 viewBox, currentColor).
 * `PlusIcon` is the accordion's toggle glyph (rotated 45deg via CSS when a question is open,
 * turning "+" into "×" — no separate close icon needed). The rest are the small optional
 * per-item icon set, rendered inside the expanded answer only. */
const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 5v14M5 12h14" {...STROKE} />
    </svg>
  );
}

export function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.6v.4" {...STROKE} />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function QuestionCircleIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} strokeDasharray="2 3" />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.6v.4" {...STROKE} />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M12 11v5.5" {...STROKE} />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PackageIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" {...STROKE} />
      <path d="M4 8l8 4.5L20 8M12 12.5V21" {...STROKE} />
    </svg>
  );
}

export function ShipIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 14.5h17l-2.5 5.5H6l-2.5-5.5Z" {...STROKE} />
      <path d="M6.5 14.5v-5h11v5" {...STROKE} />
      <path d="M9.5 9.5V5.5h2.5v4M14 9.5V6.5h2.5v3" {...STROKE} />
    </svg>
  );
}

export function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12Z" {...STROKE} />
      <circle cx="12" cy="9" r="2.5" {...STROKE} />
    </svg>
  );
}

export const FAQ_ITEM_ICONS: Record<string, (props: { className?: string }) => React.ReactNode> = {
  "help-circle": HelpCircleIcon,
  "question-circle": QuestionCircleIcon,
  info: InfoIcon,
  package: PackageIcon,
  ship: ShipIcon,
  "map-pin": MapPinIcon,
};

/** Falls back to the generic help-circle glyph for an unset or unrecognized icon key. */
export function resolveFaqItemIcon(icon: string | null): (props: { className?: string }) => React.ReactNode {
  return (icon && FAQ_ITEM_ICONS[icon]) || HelpCircleIcon;
}
