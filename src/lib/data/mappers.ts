/**
 * Shared date/text formatting between Postgres columns and the app's
 * existing display-string conventions (mock-data.ts stores dates as
 * free-form strings like "May 20, 2026", "Jan 2024", "1 hour ago" — the
 * DB stores real `date`/`timestamptz` columns). Keeping the conversion
 * here means the rest of the app never has to know the difference.
 */
import { format, formatDistanceToNow, isValid, parse } from "date-fns";

const DATE_DISPLAY = "MMM d, yyyy"; // "May 20, 2026"
const MONTH_YEAR_DISPLAY = "MMM yyyy"; // "Jan 2024"

export function dbDateToDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  return isValid(d) ? format(d, DATE_DISPLAY) : "—";
}

/** Returns a Postgres `date` literal (yyyy-MM-dd), or null for unparsable/empty input (e.g. the "—" sentinel). */
export function displayToDbDate(value: string | null | undefined): string | null {
  if (!value || value === "—") return null;
  const d = parse(value, DATE_DISPLAY, new Date());
  return isValid(d) ? format(d, "yyyy-MM-dd") : null;
}

export function dbDateToMonthYear(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  return isValid(d) ? format(d, MONTH_YEAR_DISPLAY) : "—";
}

export function monthYearToDbDate(value: string | null | undefined): string | null {
  if (!value || value === "—") return null;
  const d = parse(value, MONTH_YEAR_DISPLAY, new Date());
  return isValid(d) ? format(d, "yyyy-MM-dd") : null;
}

const DATE_DISPLAY_SHORT = "MMM d"; // "Jun 14" — Task.dueDate's format app-wide (see src/lib/dates.ts formatDateShort)

/** Task.dueDate is deliberately stored/displayed with no year (see
 * src/lib/dates.ts). Reading back from a real `date` column, drop the year
 * to match. */
export function dbDateToDisplayShort(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return isValid(d) ? format(d, DATE_DISPLAY_SHORT) : "";
}

/** Inverse of the above — "Jun 14" has no year, so this assumes the given
 * fallback year (defaults to the current year). Good enough for a
 * single-tenant agency tool; revisit if tasks start spanning years ambiguously. */
export function displayShortToDbDate(value: string | null | undefined, fallbackYear = new Date().getFullYear()): string | null {
  if (!value) return null;
  const withYear = /\d{4}/.test(value) ? value : `${value} ${fallbackYear}`;
  for (const fmt of ["MMM d yyyy", "MMM d, yyyy", "yyyy-MM-dd"]) {
    const d = parse(withYear, fmt, new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }
  return null;
}

export function timestampToRelative(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : undefined;
}

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Document.size is a formatted string ("428 KB") everywhere in the app;
 * the DB stores raw bytes. */
export function sizeStringToBytes(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unitIdx = SIZE_UNITS.findIndex((u) => u.toLowerCase() === m[2].toLowerCase());
  if (unitIdx < 0 || Number.isNaN(n)) return null;
  return Math.round(n * Math.pow(1024, unitIdx));
}

export function bytesToSizeString(value: number | null | undefined): string {
  if (!value || value <= 0) return "0 B";
  const exp = Math.min(SIZE_UNITS.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const n = value / Math.pow(1024, exp);
  return `${exp === 0 ? n : n.toFixed(1)} ${SIZE_UNITS[exp]}`;
}

/** Drops keys whose value is `undefined` so partial updates only touch the columns that changed. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
