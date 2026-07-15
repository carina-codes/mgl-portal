/**
 * Shared timezone list used anywhere a workspace, client, or user needs to
 * pick an IANA timezone (workspace settings, client profile forms, etc).
 */
export const TIMEZONE_OPTIONS = [
  { tz: "Pacific/Honolulu", label: "Honolulu (HST)" },
  { tz: "America/Los_Angeles", label: "Los Angeles (Pacific)" },
  { tz: "America/Denver", label: "Denver (Mountain)" },
  { tz: "America/Chicago", label: "Chicago (Central)" },
  { tz: "America/New_York", label: "New York (Eastern)" },
  { tz: "America/Sao_Paulo", label: "São Paulo" },
  { tz: "UTC", label: "UTC" },
  { tz: "Europe/London", label: "London" },
  { tz: "Europe/Berlin", label: "Berlin / Paris" },
  { tz: "Europe/Athens", label: "Athens" },
  { tz: "Europe/Moscow", label: "Moscow" },
  { tz: "Asia/Dubai", label: "Dubai" },
  { tz: "Asia/Kolkata", label: "Mumbai / New Delhi" },
  { tz: "Asia/Singapore", label: "Singapore" },
  { tz: "Asia/Tokyo", label: "Tokyo" },
  { tz: "Australia/Sydney", label: "Sydney" },
  { tz: "Pacific/Auckland", label: "Auckland" },
] as const;

/** Detect the current device's IANA timezone, falling back to UTC. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
