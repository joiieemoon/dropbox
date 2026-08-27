/**
 * Format a duration in seconds into a human-friendly string.
 * - 0s    → "0s"
 * - 45s   → "45s"
 * - 67s   → "1m 7s"
 * - 125s  → "2m 5s"
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
