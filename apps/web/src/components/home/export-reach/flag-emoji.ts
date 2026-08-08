/** ISO 3166-1 alpha-2 → flag emoji via Unicode regional indicator symbols (e.g. "TH" →
 * 🇹🇭) — no flag image assets needed. */
export function getFlagEmoji(alpha2: string): string {
  return alpha2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65));
}
