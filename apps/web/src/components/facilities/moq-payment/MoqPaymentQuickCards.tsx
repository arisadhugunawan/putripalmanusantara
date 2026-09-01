import type { MoqPaymentQuickCard } from "@ppn/shared-types";
import { Card } from "@ppn/ui-components";
import { MOQ_PAYMENT_QUICK_CARD_ICONS } from "./MoqPaymentIcons";

/** Compact highlight-card row above the Business Terms panel. Filters on `value.trim() !== ""`
 * here — the single source of truth for the "blank value hides the card" rule, reused by both
 * the public page and the admin draft preview. Renders nothing when every card is hidden.
 * A server component: the hover lift is `motion-safe:` CSS, not a `useReducedMotion()` JS hook
 * (see ShippingPartnerMarquee.tsx for the same convention), so no client boundary is needed. */
export function MoqPaymentQuickCards({ cards }: { cards: MoqPaymentQuickCard[] }) {
  const visible = cards.filter((card) => card.value.trim() !== "");
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {visible.map((card) => {
        const Icon = MOQ_PAYMENT_QUICK_CARD_ICONS[card.icon];
        return (
          <Card
            key={card.id}
            className="border border-neutral-200 bg-white transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-small font-medium uppercase tracking-wide text-primary-700">{card.label}</p>
            <p className="mt-1 text-body font-medium text-neutral-900">{card.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
