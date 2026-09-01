"use client";

import * as React from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { File, FileText, FileImage, FileVideo, FileArchive, Search, Plus, Minus, Upload } from "lucide-react";
import type { Document } from "@/lib/mock-data";
import { toast } from "sonner";
import { checkUploadAllowed } from "@/lib/upload-validation";

export function getAttachFileIcon(fileName: string, className = "h-4 w-4 shrink-0") {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  let IconComponent = File;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "fig"].includes(ext)) {
    IconComponent = FileImage;
  } else if (ext === "pdf" || ["doc", "docx"].includes(ext)) {
    IconComponent = FileText;
  } else if (["zip", "rar", "7z", "tar"].includes(ext)) {
    IconComponent = FileArchive;
  } else if (["mp4", "mov", "avi"].includes(ext)) {
    IconComponent = FileVideo;
  }
  return <IconComponent className={cn(className, "text-foreground")} />;
}

/**
 * Shared "Attach from Files" modal — the single canonical file-browser used
 * anywhere a document from the workspace can be attached to a message,
 * comment, or thread. Reused across the rich text editor's attach button
 * and any bespoke attach-from-files flows (e.g. project chat threads).
 */
export function AttachFromFilesDialog({
  open,
  onOpenChange,
  projectId,
  allowWorkspaceToggle = true,
  selectedIds = [],
  onSelect,
  onDeselect,
  description = "Choose a file uploaded within the workspace to attach to your message.",
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Scopes the file list to this project by default. */
  projectId?: string;
  /** Show the "This Project Files" / "All Workspace Files" toggle (only relevant when projectId is set). */
  allowWorkspaceToggle?: boolean;
  /** Document ids that should render with the "-" (attached) state. */
  selectedIds?: string[];
  onSelect: (doc: Document) => void;
  onDeselect?: (doc: Document) => void;
  description?: string;
  footer?: React.ReactNode;
}) {
  const [search, setSearch] = React.useState("");
  const [scope, setScope] = React.useState<"project" | "all">(projectId ? "project" : "all");
  const [dropHover, setDropHover] = React.useState(false);

  React.useEffect(() => {
    setScope(projectId ? "project" : "all");
  }, [projectId]);

  const allDocuments = useStore((s) => s.documents);
  const projects = useStore((s) => s.projects);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const showWorkspaceToggle = allowWorkspaceToggle && !!projectId;

  const handleUploadFile = async (file: File) => {
    const targetProjectId = projectId || projects[0]?.id;
    if (!targetProjectId) return;

    const rejection = checkUploadAllowed(file);
    if (rejection) {
      toast.error(rejection.message);
      return;
    }

    const size = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    try {
      const doc = await uploadDocument(
        {
          projectId: targetProjectId,
          name: file.name,
          folder: "Attachments",
          size,
          shared: true,
        },
        file
      );

      toast.success(`${doc.name} uploaded`);
      onSelect(doc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload file");
    }
  };

  const filteredDocuments = React.useMemo(() => {
    let docs = allDocuments.filter((d) => d.name !== ".keep");
    if (projectId && (scope === "project" || !showWorkspaceToggle)) {
      docs = docs.filter((d) => d.projectId === projectId);
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(q));
    }
    return docs;
  }, [allDocuments, projectId, scope, showWorkspaceToggle, search]);

  const showProjectColumn = showWorkspaceToggle && scope === "all";

  const getProjectName = (pId: string) => projects.find((p) => p.id === pId)?.name || "General";

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} title="Attach from Files" description={description} size="lg">
      <div className="space-y-4">
        <label
          onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
          onDragLeave={() => setDropHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropHover(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleUploadFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
            dropHover ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted"
          )}
        >
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadFile(f);
              e.target.value = "";
            }}
          />
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div className="text-sm font-medium text-foreground">Drop a file or click to upload</div>
          <div className="text-[11px] text-muted-foreground">Uploads directly into this project's files</div>
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-background outline-none border-border focus:ring-1 focus:ring-primary"
            />
          </div>

          {showWorkspaceToggle && (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "project" | "all")}
              className="px-3 py-2 text-sm border rounded-xl bg-background outline-none border-border focus:ring-1 focus:ring-primary"
            >
              <option value="project">This Project Files</option>
              <option value="all">All Workspace Files</option>
            </select>
          )}
        </div>

        <div
          className="border border-border/60 overflow-hidden max-h-[300px] overflow-y-auto"
          style={{ borderRadius: "20px 0 0 20px" }}
        >
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                {showProjectColumn && <th className="px-4 py-2 font-semibold">Project</th>}
                <th className="px-4 py-2 font-semibold">Size</th>
                <th className="px-4 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={showProjectColumn ? 4 : 3} className="px-4 py-8 text-center text-muted-foreground">
                    No files found.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground max-w-[240px]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getAttachFileIcon(doc.name)}
                          <span className="truncate" title={doc.name}>{doc.name}</span>
                        </div>
                      </td>
                      {showProjectColumn && (
                        <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]" title={getProjectName(doc.projectId)}>
                          {getProjectName(doc.projectId)}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-muted-foreground">{doc.size}</td>
                      <td className="px-4 py-2.5 text-right">
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => onDeselect?.(doc)}
                            aria-label={`Remove ${doc.name}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelect(doc)}
                            aria-label={`Attach ${doc.name}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {footer}
      </div>
    </AppDialog>
  );
}
