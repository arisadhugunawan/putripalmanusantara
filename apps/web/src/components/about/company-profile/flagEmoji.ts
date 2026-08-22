/** Renders a country's flag from its ISO 3166-1 alpha-2 code as a Unicode Regional Indicator
 * Symbol pair (e.g. "TH" -> 🇹🇭) — no flag image asset to upload, host, or ever distort;
 * the OS/browser's own emoji font always renders it at the correct aspect ratio. */
export function flagEmoji(alpha2: string): string {
  return alpha2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
