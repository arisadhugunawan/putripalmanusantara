"use client";

import type { ShipmentCommitmentItem } from "@ppn/shared-types";
import { Card, cn } from "@ppn/ui-components";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SHIPMENT_ICONS } from "./ShipmentIcons";

/** The 3 "Our Commitment" mini statement cards — icon nudges slightly on hover. */
export function ShipmentCommitmentCards({ items }: { items: ShipmentCommitmentItem[] }) {
  const reducedMotion = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = SHIPMENT_ICONS[item.icon];
        return (
          <Card key={item.id} className="group border border-neutral-200 bg-white text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  !reducedMotion && "group-hover:-translate-y-0.5 group-hover:scale-110",
                )}
              />
            </span>
            <p className="mt-3 text-body-lg font-medium text-neutral-900">{item.title}</p>
            {item.description && <p className="mt-1.5 text-small text-neutral-600">{item.description}</p>}
          </Card>
        );
      })}
    </div>
  );
}
