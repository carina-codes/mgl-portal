"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { downloadDocument } from "@/lib/download-document";
import { AppDialog, TextField, FieldGroup, FieldLabel } from "@/components/ui/app-dialog";
import {
  Download,
  Eye,
  Lock,
  Upload,
  FolderPlus,
  Folder,
  ArrowRightLeft,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Cloud,
  HardDrive,
  ChevronRight,
  ArrowLeft,
  Settings,
  RefreshCw,
  Search,
  Pen,
  FileArchive,
  FileCode,
  FileVideo,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isImageFile } from "@/components/file-preview-dialog";

const PROVIDERS = {
  gdrive: { label: "Google Drive", icon: Cloud, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  dropbox: { label: "Dropbox", icon: Folder, color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  onedrive: { label: "OneDrive", icon: Cloud, color: "bg-blue-600/10 text-blue-700 border-blue-600/20" },
  box: { label: "Box.com", icon: HardDrive, color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
};

const PROVIDER_METAS = [
  { id: "gdrive", name: "Google Drive", desc: "Connect Google Drive to sync and manage client project assets.", logo: Cloud, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "dropbox", name: "Dropbox", desc: "Sync files with your Dropbox Business account.", logo: Folder, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { id: "onedrive", name: "OneDrive", desc: "Link Microsoft OneDrive for Business folders.", logo: Cloud, color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
  { id: "box", name: "Box.com", desc: "Connect Box.com storage for enterprise-grade file controls.", logo: HardDrive, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
];

function FilesView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const documents = useStore((s) => s.documents);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const storageConnections = useStore((s) => s.storageConnections);
  const connectStorage = useStore((s) => s.connectStorage);
  const disconnectStorage = useStore((s) => s.disconnectStorage);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const renameDocument = useStore((s) => s.renameDocument);
  const toggleDocumentShared = useStore((s) => s.toggleDocumentShared);

  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<"list" | "grid">("grid");


  // Connection Dialog states
  const [connectingProvider, setConnectingProvider] = useState<"gdrive" | "dropbox" | "onedrive" | "box" | null>(null);
  const [email, setEmail] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const projectParam = searchParams.get("project");
  const memberParam = searchParams.get("member");

  // Folder Explorer states
  // Active Client & Projects Calculation
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === clientParam);
  }, [clients, clientParam]);

  const activeMember = useMemo(() => {
    return users.find((u) => u.id === memberParam);
  }, [users, memberParam]);

  const clientProjects = useMemo(() => {
    if (!clientParam) return [];
    return projects.filter((p) => p.clientId === clientParam);
  }, [projects, clientParam]);

  const clientProjectIds = useMemo(() => {
    return clientProjects.map((p) => p.id);
  }, [clientProjects]);

  const clientFiles = useMemo(() => {
    if (clientParam) {
      return documents.filter((d) => clientProjectIds.includes(d.projectId) && d.name !== ".keep");
    }
    if (memberParam) {
      return documents.filter((d) => d.uploadedBy === memberParam && d.name !== ".keep");
    }
    return documents.filter((d) => d.name !== ".keep");
  }, [documents, clientParam, clientProjectIds, memberParam]);

  const filteredFiles = useMemo(() => {
    return clientFiles.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [clientFiles, search]);

  // Selections & Bulk Actions
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  useEffect(() => {
    setSelectedFileIds([]);
  }, [search, clientParam, memberParam]);

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };



  // Inline Renaming States
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");
  const [validationError, setValidationError] = useState(false);

  const startEditing = (id: string, name: string) => {
    setEditingDocId(id);
    setEditingDocName(name);
    setValidationError(false);
  };

  const handleCancelRename = () => {
    setEditingDocId(null);
    setEditingDocName("");
    setValidationError(false);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingDocName.trim()) {
      setValidationError(true);
      toast.error("File name cannot be empty");
      return;
    }
    try {
      await renameDocument(id, editingDocName.trim());
      toast.success("File renamed successfully");
      setEditingDocId(null);
      setEditingDocName("");
      setValidationError(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename file");
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "zip" || ext === "rar" || ext === "tar" || ext === "gz") {
      return FileArchive;
    }
    if (["js", "ts", "tsx", "jsx", "html", "css", "py", "go", "rs", "json", "md"].includes(ext || "")) {
      return FileCode;
    }
    return FileText;
  };

  // A document created via "paste a video link" instead of a real upload:
  // it has a previewUrl (the link itself) but no storagePath, since
  // nothing was ever sent to Storage.
  const isVideoLinkDocument = (file: { previewUrl?: string; storagePath?: string }) =>
    !!file.previewUrl && !file.storagePath;

  const getAssociatedTask = (fileName: string, projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return null;
    const nameLower = fileName.toLowerCase();
    
    if (nameLower.includes("sow") || nameLower.includes("contract")) {
      const match = projectTasks.find(t => t.title.toLowerCase().includes("api") || t.title.toLowerCase().includes("copywriting"));
      if (match) return match;
    }
    if (nameLower.includes("assets") || nameLower.includes("color") || nameLower.includes("icon")) {
      const match = projectTasks.find(t => t.title.toLowerCase().includes("color") || t.title.toLowerCase().includes("icon") || t.title.toLowerCase().includes("avatar"));
      if (match) return match;
    }
    if (nameLower.includes("research") || nameLower.includes("interview") || nameLower.includes("notes")) {
      const match = projectTasks.find(t => t.title.toLowerCase().includes("audit") || t.title.toLowerCase().includes("states"));
      if (match) return match;
    }
    if (nameLower.includes("sitemap") || nameLower.includes("design") || nameLower.includes("prototype")) {
      const match = projectTasks.find(t => t.title.toLowerCase().includes("prototype") || t.title.toLowerCase().includes("navigation") || t.title.toLowerCase().includes("wireframe"));
      if (match) return match;
    }
    
    return projectTasks[0] || null;
  };

  return (
    <AppShell>
      {/* Custom Header Layout */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            {activeClient ? `${activeClient.name} files` : (activeMember ? `${activeMember.name} files` : "All files")}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {filteredFiles.length} files
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedFileIds.length > 0 && (
            <button
              onClick={async () => {
                if (confirm(`Are you sure you want to delete ${selectedFileIds.length} selected files?`)) {
                  try {
                    await Promise.all(selectedFileIds.map((id) => deleteDocument(id)));
                    setSelectedFileIds([]);
                    toast.success("Selected files deleted successfully");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to delete selected files");
                  }
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-semibold text-rose-50 hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedFileIds.length})
            </button>
          )}
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button
            onClick={() => open("doc.upload", { clientId: clientParam })}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" /> Upload file
          </button>
        </div>
      </div>

      {/* Search Input - No Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-72 rounded-full border border-border bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      {/* Grid or List Display */}
      <div>
        {view === "grid" ? (
          <div className="space-y-6">
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.name);
                  const project = projects.find((p) => p.id === file.projectId);
                  const associatedTask = getAssociatedTask(file.name, file.projectId);
                  return (
                    <div
                      key={file.id}
                      className={cn(
                        "panel overflow-hidden bg-card flex flex-col justify-between group relative transition-all border-border/60",
                        selectedFileIds.includes(file.id) ? "border-primary/50 ring-1 ring-primary/20 bg-primary/[0.01]" : ""
                      )}
                    >
                      <div className={cn(
                        "absolute top-2.5 left-2.5 z-10 transition-opacity",
                        selectedFileIds.includes(file.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={() => toggleSelectFile(file.id)}
                          className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>

                      <div className="h-28 bg-muted/40 flex items-center justify-center relative select-none overflow-hidden w-full">
                        {file.previewUrl && isImageFile(file.name) ? (
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : isVideoLinkDocument(file) ? (
                          <FileVideo className="h-10 w-10 text-foreground" />
                        ) : (
                          <FileIcon className="h-10 w-10 text-foreground" />
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          {editingDocId === file.id ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                value={editingDocName}
                                onChange={(e) => setEditingDocName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveRename(file.id)}
                                className={cn(
                                  "w-full px-2 py-1 text-xs border rounded-xl bg-background outline-none",
                                  validationError ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:ring-1 focus:ring-primary"
                                )}
                                autoFocus
                              />
                              <button onClick={() => handleSaveRename(file.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={handleCancelRename} className="p-1 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h4
                              className="text-xs font-bold text-foreground truncate cursor-pointer"
                              title="Double-click to rename"
                              onDoubleClick={() => startEditing(file.id, file.name)}
                            >
                              {file.name}
                            </h4>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {file.size} · {file.uploadedAt}
                          </p>
                          {(project || associatedTask) && (
                            <div className="mt-2.5 space-y-1 border-t border-border/20 pt-2 text-[10px]">
                              {project && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Folder className="h-3.5 w-3.5 text-primary shrink-0 opacity-70" />
                                  <span className="truncate text-foreground/80 font-medium">{project.name}</span>
                                </div>
                              )}
                              {associatedTask && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-70" />
                                  <span className="truncate text-foreground/70">{associatedTask.title}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                          <button
                            onClick={async () => {
                              try {
                                await toggleDocumentShared(file.id);
                                toast.success(`Visibility updated for ${file.name}`, {
                                  description: !file.shared ? "Changed to Client Shared" : "Changed to Internal Only"
                                });
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Failed to update visibility");
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] hover:bg-muted/80 px-2 py-0.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-border/60"
                            title="Click to toggle visibility"
                          >
                            {file.shared ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                                <Eye className="h-3 w-3" /> Client Shared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-muted-foreground font-semibold">
                                <Lock className="h-3 w-3" /> Internal Only
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-1">
                            {isVideoLinkDocument(file) ? (
                              <a
                                href={file.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                                title="Open video link"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <button
                                onClick={() => downloadDocument(file)}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(file.id, file.name)}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                              title="Rename"
                            >
                              <Pen className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => open("doc.delete", { documentId: file.id })}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel p-12 text-center text-muted-foreground bg-card/50">
                <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <div className="text-sm font-semibold text-foreground">No Files Found</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Upload files to start managing assets for this view.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFileIds(filteredFiles.map(f => f.id));
                          } else {
                            setSelectedFileIds([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Size</th>
                    <th className="px-5 py-3 font-medium">Uploaded</th>
                    <th className="px-5 py-3 font-medium">Visibility</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.name);
                    return (
                      <tr
                        key={file.id}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-muted/40 transition-colors",
                          selectedFileIds.includes(file.id) && "bg-primary/[0.01]"
                        )}
                      >
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedFileIds.includes(file.id)}
                            onChange={() => toggleSelectFile(file.id)}
                            className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3 font-medium">
                          <span className="inline-flex items-center gap-2.5">
                            {file.previewUrl && isImageFile(file.name) ? (
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="h-7 w-7 rounded object-cover border border-border/50 shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 flex items-center justify-center rounded bg-muted/40 text-muted-foreground border border-border/20 shrink-0">
                                {isVideoLinkDocument(file) ? (
                                  <FileVideo className="h-4 w-4" />
                                ) : (
                                  <FileIcon className="h-4 w-4" />
                                )}
                              </div>
                            )}
                            <span>{file.name}</span>
                          </span>
                        </td>
                      <td className="px-5 py-3 text-muted-foreground">File</td>
                      <td className="px-5 py-3 text-muted-foreground">{file.size}</td>
                      <td className="px-5 py-3 text-muted-foreground">{file.uploadedAt}</td>
                      <td className="px-5 py-3">
                        {file.shared ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700">
                            <Eye className="h-3 w-3" /> Client
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" /> Internal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isVideoLinkDocument(file) ? (
                            <a
                              href={file.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                            >
                              <ExternalLink className="h-3 w-3" /> Open link
                            </a>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadDocument(file);
                              }}
                              className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                            >
                              Download
                            </button>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await deleteDocument(file.id);
                                toast.success(`Deleted ${file.name}`);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to delete file");
                              }
                            }}
                            className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/5 cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}

                  {filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No files found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilesPage() {
  return (
    <Suspense fallback={null}>
      <FilesView />
    </Suspense>
  );
}

export default FilesPage;
