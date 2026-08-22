import { cn } from "@ppn/ui-components";

export interface SpecSheetItem {
  id: string;
  label: string;
  value: string;
  /** Optional named grade/variant this row belongs to (e.g. "Edible (White Copra)") — rows
   * sharing a label render as their own sub-table under that heading. Rows with no label
   * render together, ungrouped, exactly as a single-variant product always has. */
  variantLabel: string | null;
}

/**
 * Premium "spec sheet" treatment for Section 5 (Specifications) — a green header bar in the
 * style of PPN's printed export spec sheets, with a bordered key/value table instead of the
 * generic card grid `InfoCardGrid` uses elsewhere (Export Information keeps the card grid;
 * this component is Specifications-only, deliberately not shared, since the two sections read
 * differently: a printed spec sheet vs. quick-scan export facts).
 *
 * Some products (e.g. Copra) sell several grades side by side, each with its own full spec
 * set — mixing all of them into one table would be unreadable, so rows sharing a
 * `variantLabel` are grouped into their own sub-table with a heading (brief: "buatkan rapih").
 */
export function ProductSpecSheet({
  items,
  heading = "Specifications",
  className,
}: {
  items: SpecSheetItem[];
  /** Localized bar text — defaults to English so existing callers (none left) don't break. */
  heading?: string;
  className?: string;
}) {
  const groups = new Map<string | null, SpecSheetItem[]>();
  for (const item of items) {
    const key = item.variantLabel;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }

  return (
    <div
      className={cn(
        "group/sheet relative overflow-hidden rounded-2xl border border-primary-200/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-premium",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary-400/20 via-primary-300/5 to-transparent blur-2xl"
      />

      <div className="relative p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-field bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 sm:px-6 sm:py-3.5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <p className="relative text-body-lg font-bold uppercase tracking-[0.08em] text-white sm:text-h3">
            {heading}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col gap-1 px-3 pb-3 sm:px-4 sm:pb-4">
        {Array.from(groups.entries()).map(([variantLabel, rows], index) => (
          <div key={variantLabel ?? `__ungrouped_${index}`} className={index > 0 ? "mt-3" : undefined}>
            {variantLabel && (
              <p className="mb-1.5 flex items-center gap-2 text-small font-bold uppercase tracking-[0.06em] text-primary-700">
                <span aria-hidden="true" className="h-3.5 w-1 rounded-full bg-primary-600" />
                {variantLabel}
              </p>
            )}
            <dl className="divide-y divide-neutral-100 rounded-field border border-neutral-100">
              {rows.map((item) => (
                <div
                  key={item.id}
                  className="group/row grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] items-baseline gap-x-3 px-2 py-3 transition-colors duration-200 hover:bg-primary-50/70"
                >
                  <dt className="relative text-body font-medium text-neutral-700">
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-x-1 -translate-y-1/2 scale-y-0 rounded-full bg-primary-600 transition-transform duration-200 group-hover/row:scale-y-100"
                    />
                    {item.label}
                  </dt>
                  <span aria-hidden="true" className="text-body text-neutral-400">
                    :
                  </span>
                  <dd className="text-body font-medium text-neutral-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
