/**
 * Shared date helpers.
 *
 * The app stores dates in a mix of formats depending on where they came
 * from: seed data uses "MMM DD, YYYY" (e.g. "Jun 10, 2026"), relative
 * strings like "Just now" / "2 days ago" show up for activity/submission
 * timestamps, and raw `<input type="date">` values are ISO "YYYY-MM-DD".
 * These helpers normalize between them so stored values stay consistent
 * and sortable regardless of source.
 */

/** Best-effort epoch-ms parser across "Just now", "2 hours ago", "Today",
 * "Yesterday", "N days ago", ISO strings, and "MMM DD, YYYY" strings. */
export function parseFuzzyDate(raw?: string): number {
  if (!raw) return 0;
  const s = raw.trim();
  const now = Date.now();

  if (/^just now$/i.test(s)) return now;

  const agoMatch = s.match(/^(\d+)\s*(minute|min|m|hour|hr|h|day|d)s?\s*ago$/i);
  if (agoMatch) {
    const n = parseInt(agoMatch[1], 10);
    const unit = agoMatch[2].toLowerCase();
    const ms = unit.startsWith("m") ? n * 60_000 : unit.startsWith("h") ? n * 3_600_000 : n * 86_400_000;
    return now - ms;
  }

  const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
  if (/^today/i.test(s)) {
    const d = new Date();
    if (timeMatch) d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    return d.getTime();
  }
  if (/^yesterday/i.test(s)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    if (timeMatch) d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    else d.setHours(12, 0, 0, 0);
    return d.getTime();
  }
  const daysAgoMatch = s.match(/^(\d+)\s*days?\s*ago$/i);
  if (daysAgoMatch) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(daysAgoMatch[1], 10));
    return d.getTime();
  }

  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Normalizes an ISO ("YYYY-MM-DD") or already-formatted date string into
 * the app's consistent display format: "MMM DD, YYYY". Falls back to the
 * original string if it can't be parsed. */
export function formatDateLong(input?: string): string {
  if (!input) return "";
  const s = input.trim();

  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTHS[monthIdx]} ${d}, ${y}`;
    }
  }

  // Already in "MMM DD, YYYY" (or similar parseable) form.
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return `${MONTHS[parsed.getMonth()]} ${parsed.getDate().toString().padStart(2, "0")}, ${parsed.getFullYear()}`;
  }

  return s;
}

/** Normalizes a date string into "YYYY-MM-DD" for use as an
 * `<input type="date">` value. */
export function toDateInputValue(input?: string): string {
  if (!input) return "";
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = (parsed.getMonth() + 1).toString().padStart(2, "0");
  const d = parsed.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}
