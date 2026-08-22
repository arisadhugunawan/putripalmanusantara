"use client";

import type { Locale, Translations } from "@ppn/shared-types";
import { Input } from "@ppn/ui-components";
import { useState } from "react";
import { LocaleTabs } from "./LocaleTabs";

interface TranslatableField {
  key: string;
  label: string;
}

/**
 * Collapsed-by-default "Translations ▾" toggle for one row of a reorderable list — the first
 * per-row translation editor in this codebase (every prior use of `LocaleTabs` was for a
 * single singleton form). Collapsed by default so a list of many rows stays exactly as compact
 * as it was before translations existed; expanding one row reveals `LocaleTabs` scoped to that
 * row's own local state, seeded from its `translations` prop.
 *
 * Each non-English field autosaves on blur via `onSave` (matching this codebase's per-field
 * autosave convention everywhere else) rather than a buffered submit — the English tab is not
 * rendered here at all, since the row's real scalar fields (edited above, outside this
 * component) already are the English source of truth.
 */
export function RowTranslationsDisclosure({
  translations,
  fields,
  onSave,
}: {
  translations: Translations | null | undefined;
  fields: TranslatableField[];
  onSave: (locale: Locale, key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Translations>(translations ?? {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-small text-neutral-600 underline">
        Translations ▾
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-field border border-neutral-200 bg-neutral-50 p-3">
      <button type="button" onClick={() => setOpen(false)} className="text-small text-neutral-600 underline">
        Translations ▴
      </button>
      <div className="mt-2">
        <LocaleTabs>
          {(locale) =>
            locale === "en" ? (
              <p className="text-small text-neutral-500">
                English is the base text — edit it above, not here.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-small text-neutral-600">{field.label}</label>
                    <Input
                      value={local[locale]?.[field.key] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLocal((prev) => ({
                          ...prev,
                          [locale]: { ...prev[locale], [field.key]: value },
                        }));
                      }}
                      onBlur={(e) => onSave(locale, field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )
          }
        </LocaleTabs>
      </div>
    </div>
  );
}
