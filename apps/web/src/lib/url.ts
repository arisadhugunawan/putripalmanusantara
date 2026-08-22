/**
 * Sanitizes an admin-entered external URL (social media links, Google Maps links) before it's
 * ever rendered into an `href`. Two real problems this guards against: (1) an admin pasting a
 * URL without its `https://` scheme — the browser then treats it as a same-site relative link,
 * silently turning a real destination into a broken one (this happened in production data: a
 * stored LinkedIn URL was ` www.linkedin.com/...`, no scheme, leading whitespace); (2) a
 * `javascript:` URL, which would execute as script if ever clicked. Returns `null` — never a
 * placeholder `#` — so callers can simply omit the link entirely rather than render one that's
 * either broken or dangerous.
 */
export function sanitizeExternalUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (/^javascript:/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
