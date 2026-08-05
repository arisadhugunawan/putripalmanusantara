"use client";

import { useEffect } from "react";

/** Root layout can't render a dynamic `lang` (it must stay static for SSG/ISR — see
 * app/layout.tsx), so this corrects `<html lang>` client-side once the actual locale
 * segment is known. Purely cosmetic/a11y; doesn't affect routing or rendered content. */
export function LocaleHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
