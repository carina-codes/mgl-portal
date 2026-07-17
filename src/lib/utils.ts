import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips HTML tags from a rich-text string, producing a plain-text preview.
 * Used anywhere a rich editor's HTML output needs to render as a short,
 * truncated snippet (e.g. a card preview) instead of full formatted markup.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<(p|div|br|li|h[1-6])[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
