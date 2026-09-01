"use client";

import { useEffect, useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Download, FileText } from "lucide-react";
import { getDocumentDownloadUrl } from "@/lib/data/documents";

export type PreviewableFile = {
  name: string;
  size: string;
  folder?: string;
  previewUrl?: string;
  /** Storage path for a real uploaded file (see uploadDocumentRecord). When
   * present, this is used to fetch a signed preview URL instead of relying
   * on previewUrl, which for uploaded files is just a session-local blob:
   * URL that stops working the moment the tab reloads. */
  storagePath?: string;
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

export function isImageFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}

export function isPdfFile(name: string) {
  return name.split(".").pop()?.toLowerCase() === "pdf";
}

/** Only images and PDFs can actually be previewed inline. */
export function isPreviewableFile(name: string) {
  return isImageFile(name) || isPdfFile(name);
}

/**
 * Shared file preview modal — used anywhere a document/attachment can be
 * opened for a quick look (project Files tabs, task/request Attachments
 * sections) across both owner and client views.
 */
export function FilePreviewDialog({
  file,
  onClose,
  onDownload,
}: {
  file: PreviewableFile | null;
  onClose: () => void;
  onDownload?: (file: PreviewableFile) => void;
}) {
  if (!file) return null;
  return <FilePreviewDialogInner file={file} onClose={onClose} onDownload={onDownload} />;
}

/** Split out so the signed-URL-fetching effect only runs while a file is
 * actually open, and resets cleanly (via `key`-driven remount below is
 * unnecessary — file identity is enough) each time a different file opens. */
function FilePreviewDialogInner({
  file,
  onClose,
  onDownload,
}: {
  file: PreviewableFile;
  onClose: () => void;
  onDownload?: (file: PreviewableFile) => void;
}) {
  const isImage = isImageFile(file.name);
  const isPdf = isPdfFile(file.name);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    setSignedUrl(null);
    if (!file.storagePath || !(isImage || isPdf)) return;
    let cancelled = false;
    getDocumentDownloadUrl(file.storagePath)
      .then((url) => { if (!cancelled) setSignedUrl(url); })
      .catch(() => { /* falls back to the "no preview" state below */ });
    return () => { cancelled = true; };
  }, [file.storagePath, isImage, isPdf]);

  const previewSrc = signedUrl ?? file.previewUrl;

  return (
    <AppDialog
      open={!!file}
      onOpenChange={(v) => !v && onClose()}
      title={file.name}
      description={file.folder ? `${file.folder} · ${file.size}` : file.size}
      icon={<FileText className="h-5 w-5" />}
      size="xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            onClick={() => onDownload?.(file)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      {previewSrc ? (
        isImage ? (
          <img src={previewSrc} alt={file.name} className="w-full max-h-[70vh] object-contain rounded-xl" />
        ) : isPdf ? (
          <iframe src={previewSrc} title={file.name} className="w-full h-[70vh] rounded-xl border border-border/60" />
        ) : null
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border/60">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
          <span className="font-medium">No preview available for this file yet.</span>
          <span className="text-xs text-muted-foreground/75">Download it to view the full contents.</span>
        </div>
      )}
    </AppDialog>
  );
}
