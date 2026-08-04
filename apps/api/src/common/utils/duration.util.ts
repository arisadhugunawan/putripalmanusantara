const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/** Parses simple durations like "8h", "15m", "900000" (already ms) into milliseconds. */
export function parseDurationMs(value: string, fallbackMs: number): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const match = /^(\d+)([smhd])$/.exec(trimmed);
  if (!match) return fallbackMs;
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit];
}
