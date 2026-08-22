import type { ProductShape } from "@ppn/shared-types";
import { SafeImage } from "@/components/SafeImage";

/**
 * "Shape & Size" — one card per shape: a small reference photo beside the shape name and the
 * sizes available in it.
 *
 * `sizes` is stored as free text, one entry per line, and rendered verbatim: size notation
 * differs per product ("25x25x17 - (108 pcs/kg)" vs "18x50 - (72 pcs/kg)") and parsing it into
 * fixed columns would eventually mangle a product that does not follow the pattern.
 */
export function ShapeSizeGrid({ shapes }: { shapes: ProductShape[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
      {shapes.map((shape) => {
        const sizes = shape.sizes
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        return (
          <div key={shape.id} className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-field border border-neutral-200 bg-neutral-50">
              <SafeImage media={shape.media} sizes="80px" className="object-contain p-1.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-body font-semibold uppercase tracking-wide text-neutral-900">
                {shape.name}
              </h3>
              {sizes.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {sizes.map((size) => (
                    <li key={size} className="text-body text-neutral-600">
                      {size}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** "Detail Information" — a plain two-column table of commercial facts (MOQ, terms, capacity).
 * A table rather than cards because every row is a short label/value pair and buyers scan it. */
export function DetailInformationTable({
  rows,
}: {
  rows: { id: string; label: string; value: string }[];
}) {
  return (
    // Wide values (container specs) scroll inside the table, never the page.
    <div className="overflow-x-auto rounded-card border border-neutral-200">
      <table className="w-full border-collapse text-left">
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={index % 2 === 1 ? "bg-neutral-50/60" : undefined}
            >
              <th
                scope="row"
                className="w-[38%] min-w-[10rem] border-b border-neutral-200 px-5 py-3.5 align-top text-body font-medium text-neutral-700"
              >
                {row.label}
              </th>
              <td className="border-b border-neutral-200 px-5 py-3.5 align-top text-body text-neutral-900">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
