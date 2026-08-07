import { Card, cn } from "@ppn/ui-components";

export interface InfoCardItem {
  id: string;
  label: string;
  value: string;
}

/** Modern spec/info cards — used for Section 5 "Specifications" and Section 9 "Export
 * Information" (same visual language, different data). Replaces the old plain <table>. */
export function InfoCardGrid({ items, className }: { items: InfoCardItem[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <Card
          key={item.id}
          hoverable
          className="border border-neutral-200 bg-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <p className="text-small font-medium uppercase tracking-wide text-primary-700">{item.label}</p>
          <p className="mt-1.5 text-body-lg font-medium text-neutral-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
