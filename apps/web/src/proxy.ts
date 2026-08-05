import { DEFAULT_LOCALE, isLocale } from "@ppn/shared-types";
import { NextResponse, type NextRequest } from "next/server";

const LOCALE_COOKIE = "NEXT_LOCALE";
const PUBLIC_FILE = /\.(.*)$/;

/**
 * Next 16 renamed "middleware" to "proxy" (node_modules/next/dist/docs/.../middleware.md).
 * Redirects bare paths to a locale-prefixed one. Per the brief, English is always the
 * default/first-visit language — no Accept-Language guessing — unless the visitor already
 * switched languages once, in which case their NEXT_LOCALE cookie choice is respected.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (isLocale(maybeLocale)) {
    // Already locale-prefixed — keep the cookie in sync so a later bare visit remembers it.
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, maybeLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const targetLocale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${targetLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Must be static string literals (Next parses this at build time, not runtime — a
  // computed template literal here fails the build). Locale codes aren't excluded here;
  // the proxy() function above already checks isLocale(maybeLocale) at runtime and just
  // refreshes the cookie + passes through for already-prefixed paths.
  matcher: ["/((?!_next|admin|api).*)", "/"],
};
