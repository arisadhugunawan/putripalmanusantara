import type { ProductPackagingApplication } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";

/**
 * Section 8 "Applications" — icon cards. The data model has no dedicated icon field, so
 * the icon is chosen by matching keywords in the (real, CMS-authored) title against a
 * small curated set, falling back to a generic icon. Only the icon choice is cosmetic —
 * the title/description text is always the real CMS content, nothing is fabricated.
 */
export function ApplicationCards({ items }: { items: ProductPackagingApplication[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} hoverable className="transition-transform duration-200 hover:-translate-y-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            {iconFor(item.title)}
          </span>
          <h3 className="mt-4 text-body-lg font-medium text-neutral-900">{item.title}</h3>
          <p className="mt-1.5 text-body text-neutral-600">{item.description}</p>
        </Card>
      ))}
    </div>
  );
}

function iconFor(title: string) {
  const t = title.toLowerCase();
  if (/food|culinary|kitchen/.test(t)) return <FoodIcon />;
  if (/export|trade|shipping|logistic/.test(t)) return <ExportIcon />;
  if (/manufactur|industr|factory/.test(t)) return <FactoryIcon />;
  if (/agricultur|farm|soil|garden/.test(t)) return <LeafIcon />;
  if (/energy|fuel|power|charcoal|combust/.test(t)) return <EnergyIcon />;
  return <GenericIcon />;
}

const ICON_PROPS = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function FoodIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M6 3v7a3 3 0 0 0 6 0V3M9 10v11M17 3c-1.5 1.5-2 3-2 5.5S16 13 17 13s2-1.5 2-4.5-.5-4-2-5.5ZM17 13v8" {...STROKE} />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 16.5V6.75A1.75 1.75 0 0 1 4.75 5h9.5A1.75 1.75 0 0 1 16 6.75v9.75M3 16.5h13M3 16.5v1.75A.75.75 0 0 0 3.75 19h1.6M16 16.5h2.35c.36 0 .65-.29.65-.65v-3.02c0-.18-.07-.35-.2-.48l-2.35-2.35H16M8.5 19a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm9 0a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z" {...STROKE} />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 21V11l5 3v-3l5 3v-3l5 3v7H3Z" {...STROKE} />
      <path d="M7 21v-4M12 21v-4M17 21v-4" {...STROKE} />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 4c0 8.837-6.163 16-15 16-1 0-2-8 2-13S17 4 20 4Z" {...STROKE} />
      <path d="M5 20c3-5 6-8 11-12" {...STROKE} />
    </svg>
  );
}

function EnergyIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...STROKE} strokeLinejoin="round" />
    </svg>
  );
}

function GenericIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" {...STROKE} />
      <path d="M12 8v5M12 16h.01" {...STROKE} />
    </svg>
  );
}
