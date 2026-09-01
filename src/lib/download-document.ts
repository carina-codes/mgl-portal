"use client";

import { toast } from "sonner";
import { getDocumentDownloadUrl } from "@/lib/data/documents";

export type DownloadableFile = {
  name: string;
  storagePath?: string;
  /** Set for a pasted video link (see UploadDocumentModal) — there's no
   * uploaded file to sign a URL for, just an external link to open. */
  previewUrl?: string;
};

const isHttpUrl = (v: string) => /^https?:\/\//i.test(v);

/**
 * Downloads a workspace file via a short-lived signed URL, or opens an
 * external link for a video-link document. Replaces the various local
 * `toast.success("Downloading...")` stand-ins that used to live next to
 * each Download button — none of them actually downloaded anything, since
 * no file was ever really uploaded before 20260901161200_document_storage.sql
 * wired up Supabase Storage.
 *
 * Files created before that migration (or any row without a real upload,
 * like a folder's ".keep" placeholder) have no storagePath — there's
 * nothing to fetch, so this says so rather than pretending to succeed.
 */
export async function downloadDocument(file: DownloadableFile): Promise<void> {
  if (!file.storagePath) {
    if (file.previewUrl && isHttpUrl(file.previewUrl)) {
      window.open(file.previewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error(`${file.name} isn't available to download — no file was stored for it.`);
    return;
  }
  try {
    const url = await getDocumentDownloadUrl(file.storagePath);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : `Failed to download ${file.name}`);
  }
}
