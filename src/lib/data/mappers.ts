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

export function timestampToRelative(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : undefined;
}

/** Drops keys whose value is `undefined` so partial updates only touch the columns that changed. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
