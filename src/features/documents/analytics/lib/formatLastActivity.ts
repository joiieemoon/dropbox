/**
 * Format a timestamp into a human-friendly relative time string.
 * - null/undefined → "Not viewed"
 * - < 1 minute     → "Just now"
 * - < 1 hour       → "5m ago"
 * - < 24 hours     → "2h ago"
 * - yesterday      → "Yesterday"
 * - < 7 days       → "3 days ago"
 * - formatted                           → else a coarser unit
 */
export function formatLastActivity(iso: string | null | undefined): string {
  if (!iso) return "Not viewed";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not viewed";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
