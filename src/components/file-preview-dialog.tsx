"use client";

import { AppDialog } from "@/components/ui/app-dialog";
import { Download, FileText } from "lucide-react";

export type PreviewableFile = {
  name: string;
  size: string;
  folder?: string;
  previewUrl?: string;
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
  const isImage = isImageFile(file.name);
  const isPdf = isPdfFile(file.name);

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
      {file.previewUrl ? (
        isImage ? (
          <img src={file.previewUrl} alt={file.name} className="w-full max-h-[70vh] object-contain rounded-xl" />
        ) : isPdf ? (
          <iframe src={file.previewUrl} title={file.name} className="w-full h-[70vh] rounded-xl border border-border/60" />
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
