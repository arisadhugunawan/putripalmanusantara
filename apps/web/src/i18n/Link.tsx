"use client";

import NextLink, { type LinkProps } from "next/link";
import { useParams } from "next/navigation";
import { forwardRef } from "react";
import { DEFAULT_LOCALE, isLocale } from "@ppn/shared-types";

/** Prefixes an internal `href` with the current route's locale segment; external/hash/mailto/tel
 * links and already-prefixed hrefs pass through unchanged. */
function localizeHref(href: LinkProps["href"], locale: string): LinkProps["href"] {
  if (typeof href !== "string") return href;
  if (/^([a-z]+:|#)/i.test(href)) return href; // external, mailto:, tel:, hash-only
  if (!href.startsWith("/")) return href;

  const [pathname, hash] = href.split("#");
  const alreadyPrefixed = new RegExp(`^/(${locale})(/|$)`).test(pathname);
  const localizedPath = alreadyPrefixed ? pathname : `/${locale}${pathname === "/" ? "" : pathname}`;
  return hash ? `${localizedPath}#${hash}` : localizedPath || `/${locale}`;
}

export const Link = forwardRef<HTMLAnchorElement, React.ComponentProps<typeof NextLink>>(
  function Link({ href, ...props }, ref) {
    const params = useParams<{ locale?: string }>();
    const locale = isLocale(params.locale ?? "") ? (params.locale as string) : DEFAULT_LOCALE;
    return <NextLink ref={ref} href={localizeHref(href, locale)} {...props} />;
  },
);
