import type { MoqPaymentQuickCardIcon } from "@ppn/shared-types";

/** Hand-authored line icons for the MOQ & Payment Terms quick overview cards — same
 * zero-external-icon-library convention as `SupplyNetworkIcons.tsx` (1.5px stroke, 24x24
 * viewBox, currentColor). */
export const MOQ_PAYMENT_QUICK_CARD_ICONS: Record<
  MoqPaymentQuickCardIcon,
  (props: { className?: string }) => React.ReactNode
> = {
  container: ContainerIcon,
  payment: PaymentIcon,
  shipping: ShippingIcon,
  currency: CurrencyIcon,
};

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ContainerIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="1" {...STROKE} />
      <path d="M8 6.5v11M13 6.5v11M3.5 12h17" {...STROKE} />
    </svg>
  );
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.8" {...STROKE} />
      <path d="M3 9.5h18" {...STROKE} />
      <path d="M6.5 14.5h4" {...STROKE} />
    </svg>
  );
}

function ShippingIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3 15.5 4.6 8h9.4l2.4 4.3H21v3.2" {...STROKE} />
      <path d="M3 15.5h1.5M14 8V5.5H8.5" {...STROKE} />
      <circle cx="8" cy="17.5" r="1.7" {...STROKE} />
      <circle cx="17.5" cy="17.5" r="1.7" {...STROKE} />
      <path d="M9.7 17.5h6.1" {...STROKE} />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M12 7.5v9M14.5 9.8c0-1.1-1.1-1.8-2.5-1.8s-2.5.8-2.5 1.9c0 2.6 5 1.2 5 3.8 0 1.1-1.1 1.9-2.5 1.9s-2.5-.7-2.5-1.8" {...STROKE} />
    </svg>
  );
}
