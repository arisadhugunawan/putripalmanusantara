"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@ppn/shared-types";
import { cn } from "@ppn/ui-components";
import { useState } from "react";

/**
 * Tab strip for editing a translatable field group across all 6 languages. Purely a UI/state
 * primitive — it tracks which locale tab is active and renders `children` once per locale,
 * hiding the inactive ones with CSS rather than unmounting them. This matters: the English
 * tab holds the model's real, `required` scalar-column inputs, and this component lives
 * inside a native `<form>` read via `FormData` on submit — if the English tab were unmounted
 * while another tab was active, its inputs would vanish from FormData and null out the
 * English source-of-truth fields on save (found and fixed during the Product form
 * integration — see git history). The caller decides how each locale's fields bind to state
 * (English binds to the model's real scalar columns, the other 5 bind into a `translations`
 * object — see apps/web/src/app/admin/produk/[id]/page.tsx for the reference integration).
 */
export function LocaleTabs({ children }: { children: (locale: Locale) => React.ReactNode }) {
  const [active, setActive] = useState<Locale>("en");

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-neutral-200">
        {SUPPORTED_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active === code}
            onClick={() => setActive(code)}
            className={cn(
              "flex items-center gap-1.5 rounded-t-field px-3 py-2 text-small font-medium transition-colors",
              active === code
                ? "border-b-2 border-primary-600 text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            <span aria-hidden="true">{LOCALE_LABELS[code].flag}</span>
            {LOCALE_LABELS[code].name}
          </button>
        ))}
      </div>
      {SUPPORTED_LOCALES.map((code) => (
        <div key={code} className={cn("pt-4", active !== code && "hidden")}>
          {children(code)}
        </div>
      ))}
    </div>
  );
}
