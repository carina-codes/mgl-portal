/**
 * Client-side gate on what can be uploaded through the Documents feature.
 * Enforced here (not just at the Storage layer) because Supabase's
 * bucket-level `allowed_mime_types` checks the browser-reported
 * Content-Type, which is unreliable/absent for a lot of these formats
 * (design files like .fig/.sketch especially) — an extension check against
 * a name we control is more precise, and lets us give a specific,
 * actionable message instead of a generic upload failure.
 */

const VIDEO_EXTENSIONS = new Set([
  "mp4", "mov", "avi", "mkv", "webm", "wmv", "flv", "m4v", "mpg", "mpeg", "3gp", "ogv",
]);

const SAFE_EXTENSIONS = new Set([
  // Documents
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "md", "rtf", "key", "pages", "numbers",
  // Images
  "png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "heif",
  // Design
  "fig", "sketch", "ai", "psd", "eps", "indd",
  // Archives
  "zip", "rar", "7z", "tar", "gz",
]);

export type UploadRejection = { reason: "video" | "unsupported"; message: string };

/** Returns null when the name+type is fine to upload, otherwise a
 * rejection with a message ready to show the user (e.g. via toast.error).
 * Split from checkUploadAllowed so call sites that only have a filename at
 * this point (e.g. re-persisting an already-picked composer attachment at
 * send time, rather than the original File) can still enforce the same
 * rule. */
export function checkNameAllowed(name: string, mimeType?: string): UploadRejection | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (mimeType?.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) {
    return {
      reason: "video",
      message: "Videos can't be uploaded directly — paste a link instead (YouTube, Vimeo, Loom, Google Drive, etc.).",
    };
  }

  if (!SAFE_EXTENSIONS.has(ext)) {
    return {
      reason: "unsupported",
      message: `"${name}" isn't a supported file type.`,
    };
  }

  return null;
}

/** Returns null when the file is fine to upload, otherwise a rejection with
 * a message ready to show the user (e.g. via toast.error). */
export function checkUploadAllowed(file: File): UploadRejection | null {
  return checkNameAllowed(file.name, file.type);
}
