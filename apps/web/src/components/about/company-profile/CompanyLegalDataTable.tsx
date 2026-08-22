interface LegalDataRow {
  id: string;
  label: string;
  value: string;
}

/**
 * Section 12/13/14/15 of the redesign brief — "Company Legal Data". Desktop: a clean two-
 * column table (label | value) with a subtle divider, no heavy borders, soft hover highlight.
 * Mobile: each row becomes a stacked LABEL / Value block instead of forcing the desktop table
 * to squeeze into a narrow viewport (brief §15's explicit "do not force a wide desktop table
 * onto mobile"). Rows with no value are never rendered — the caller filters before passing
 * rows here — and an unknown field is left blank by the Admin (or reads "Available upon
 * request") rather than ever being fabricated.
 */
export function CompanyLegalDataTable({ rows }: { rows: LegalDataRow[] }) {
  if (rows.length === 0) return null;

  return (
    <dl className="overflow-hidden rounded-card border border-neutral-200 bg-white">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={`grid grid-cols-1 gap-1.5 px-5 py-4 transition-colors duration-200 ease-out hover:bg-[#F7F9F4] sm:grid-cols-[14rem_1fr] sm:items-baseline sm:gap-6 sm:px-7 ${
            index > 0 ? "border-t border-neutral-100" : ""
          }`}
        >
          <dt className="text-small font-medium tracking-wide text-neutral-500 uppercase">{row.label}</dt>
          <dd className="whitespace-pre-line text-body text-[#17221B]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
