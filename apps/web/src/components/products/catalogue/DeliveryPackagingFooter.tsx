import { PackagingIcon } from "./PackagingIcon";

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M2 6.5h11v9H2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13 9.5h4l3.5 3.5v2.5H13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Shared export terms footer — appears once beneath the spec sheets, not per product, mirroring
 * PPN's printed spec sheet (the same Delivery Terms / Packaging row applies to every product
 * listed on it, not a per-product variant). Content is a fixed company export fact, not
 * CMS-editable yet — see README. Labels come from the UI dictionary (products.packaging*),
 * not a CMS translations column, since this footer has no backing database record at all.
 */
export function DeliveryPackagingFooter({
  deliveryTermsLabel = "Delivery Terms",
  packagingLabel = "Packaging",
  packagingOptionLabels = ["Jute Gunny Bags", "Polypropylene Bags", "Plastic Netted Bags"],
}: {
  deliveryTermsLabel?: string;
  packagingLabel?: string;
  /** [jute, polypropylene, plastic-netted] — matches the fixed icon pattern order below. */
  packagingOptionLabels?: [string, string, string];
}) {
  const packagingOptions = [
    { key: "jute", label: packagingOptionLabels[0], pattern: "weave" as const, tone: "text-accent-600" },
    { key: "pp", label: packagingOptionLabels[1], pattern: "solid" as const, tone: "text-neutral-500" },
    { key: "net", label: packagingOptionLabels[2], pattern: "mesh" as const, tone: "text-red-500" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-white to-primary-50/40 p-5 shadow-card sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-14 -bottom-14 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <TruckIcon />
          </span>
          <div>
            <p className="text-small font-semibold uppercase tracking-[0.14em] text-primary-700">{deliveryTermsLabel}</p>
            <p className="mt-0.5 text-h3 text-neutral-900">FOB, CNF, CIF</p>
          </div>
        </div>

        <div className="h-px w-full bg-neutral-200 sm:h-12 sm:w-px" aria-hidden="true" />

        <div className="flex-1">
          <p className="text-small font-semibold uppercase tracking-[0.14em] text-primary-700 sm:text-center">{packagingLabel}</p>
          <div className="mt-3 flex flex-wrap justify-start gap-5 sm:justify-center sm:gap-8">
            {packagingOptions.map((option) => (
              <div key={option.key} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-current bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-premium ${option.tone}`}
                >
                  <PackagingIcon pattern={option.pattern} />
                </span>
                <span className="max-w-[6.5rem] text-small font-medium text-neutral-600">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
