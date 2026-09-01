import type { ShippingArrangementItem } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { SHIPMENT_ICONS } from "./ShipmentIcons";

/** The 7-card "Information Cards" grid — same dataset that drives the route journey's node
 * labels, presented as quick-glance cards. New dedicated component (not `InfoCardGrid`, which
 * is shared with the product page's Export Information block). A server component: the hover
 * lift is `motion-safe:` CSS, not a `useReducedMotion()` JS hook, so no client boundary is
 * needed. */
export function ShipmentInfoCards({ items }: { items: ShippingArrangementItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = SHIPMENT_ICONS[item.icon];
        return (
          <Card
            key={item.id}
            className="border border-neutral-200 bg-white transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-small font-medium uppercase tracking-wide text-primary-700">{item.title}</p>
            <p className="mt-1 text-body font-medium text-neutral-900">{item.value}</p>
            {item.description && <p className="mt-1.5 text-small text-neutral-600">{item.description}</p>}
          </Card>
        );
      })}
    </div>
  );
}
