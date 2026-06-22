import * as React from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  File,
  Download,
  ExternalLink,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FileAttachmentCardProps = {
  id: string;
  name: string;
  size: string;
  url?: string;
  onRemove?: () => void; // If provided, renders as a composer attachment with a delete button
  className?: string;
};

export function FileAttachmentCard({
  id,
  name,
  size,
  url = "#",
  onRemove,
  className,
}: FileAttachmentCardProps) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  let icon = <File className="h-5 w-5 text-blue-500" />;
  let isImage = false;
  let isPdf = false;
  let metaDetails = `${ext.toUpperCase()} · ${size}`;
  let imagePreviewUrl = url;

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    isImage = true;
    icon = <FileImage className="h-5 w-5 text-emerald-500" />;
    metaDetails = `${ext.toUpperCase()} · 1920 × 1080 · ${size}`;
  } else if (ext === "pdf") {
    isPdf = true;
    icon = <FileText className="h-5 w-5 text-rose-500" />;
    metaDetails = `PDF · 5 pages · ${size}`;
  } else if (["doc", "docx", "txt", "rtf"].includes(ext)) {
    icon = <FileText className="h-5 w-5 text-blue-600" />;
    metaDetails = `Word · ${size}`;
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    icon = <FileText className="h-5 w-5 text-teal-600" />;
    metaDetails = `Excel · ${size}`;
  } else if (["zip", "rar", "7z", "tar"].includes(ext)) {
    icon = <FileArchive className="h-5 w-5 text-amber-600" />;
    metaDetails = `Archive · ${size}`;
  } else if (["mp4", "mov", "avi"].includes(ext)) {
    icon = <FileVideo className="h-5 w-5 text-indigo-500" />;
    metaDetails = `Video · 0:45 · ${size}`;
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url === "#" ? `https://google.com/search?q=${encodeURIComponent(name)}` : url, "_blank");
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const link = document.createElement("a");
    link.href = url === "#" ? `https://google.com/search?q=${encodeURIComponent(name)}` : url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        "group/att-card flex items-center gap-3 rounded-xl border border-border bg-card p-2 text-xs transition-all hover:border-border/80 hover:bg-muted/10",
        className
      )}
    >
      {/* Preview / Thumbnail */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        {isImage && url !== "#" ? (
          <img
            src={imagePreviewUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center justify-center text-[9px] font-bold text-rose-500 w-full h-full bg-rose-50 dark:bg-rose-950/20">
            PDF
          </div>
        ) : (
          icon
        )}
      </div>

      {/* File metadata */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground" title={name}>
          {name}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
          <span>{metaDetails}</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/45" />
          <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-2.5 w-2.5" /> Ready
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleOpen}
              className="opacity-0 group-hover/att-card:opacity-100 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              title="Open file"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="opacity-0 group-hover/att-card:opacity-100 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
