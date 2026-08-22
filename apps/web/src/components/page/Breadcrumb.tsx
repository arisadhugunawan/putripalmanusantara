import { Link } from "@/i18n/Link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** NFR-SEO-05 — breadcrumb navigation; structured data added in Phase 6.
 *
 * `color` is optional and, when omitted, renders byte-identical to before it existed (every
 * existing caller) — only `PageHeader.tsx`'s image-mode passes it, to satisfy the Inner Page
 * Header's admin-editable "Breadcrumb Color" field against a photo background instead of the
 * default flat surface. */
export function Breadcrumb({ items, color }: { items: BreadcrumbItem[]; color?: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={color ? "flex flex-wrap items-center gap-2 text-small" : "flex flex-wrap items-center gap-2 text-small text-neutral-600"}
        style={color ? { color } : undefined}
      >
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className={color ? "opacity-80 hover:opacity-100" : "hover:text-neutral-900"}>
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={index === items.length - 1 ? "page" : undefined}
                className={color ? undefined : index === items.length - 1 ? "text-neutral-900" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
