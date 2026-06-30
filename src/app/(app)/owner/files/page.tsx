"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
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
} from "lucide-react";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const storageConnections = useStore((s) => s.storageConnections);
  const connectStorage = useStore((s) => s.connectStorage);
  const disconnectStorage = useStore((s) => s.disconnectStorage);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);

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

  // Folder Explorer states
  const [path, setPath] = useState<string[]>(["client-portal"]);

  useEffect(() => {
    if (clientParam && clients.length > 0) {
      const clientObj = clients.find((c) => c.id === clientParam);
      if (clientObj) {
        setPath(["client-portal", clientObj.name]);
      }
    }
  }, [clientParam, clients]);

  const activeConn = useMemo(() => {
    if (!mounted) return null;
    return storageConnections.find((c) => c.connected) || null;
  }, [storageConnections, mounted]);

  const activeFolderDisplayPath = useMemo(() => {
    return path.join("/");
  }, [path]);

  // Find active context (if we are in a client/project directory)
  const activeClientName = path.length >= 2 ? path[1] : null;
  const activeClient = useMemo(() => {
    return clients.find((c) => c.name === activeClientName);
  }, [clients, activeClientName]);

  const activeProjectName = path.length >= 3 ? path[2] : null;
  const activeProject = useMemo(() => {
    if (!activeClient) return null;
    return projects.find((p) => p.name === activeProjectName && p.clientId === activeClient.id);
  }, [projects, activeProjectName, activeClient]);

  // Folder and Files generation in explorer
  const { subfolders, explorerFiles } = useMemo(() => {
    const foldersList: string[] = [];
    const filesList: typeof documents = [];

    if (path.length === 1) {
      // Root level: client-portal
      foldersList.push("internal");
      clients.forEach((c) => {
        if (!foldersList.includes(c.name)) foldersList.push(c.name);
      });
      documents.forEach((d) => {
        if (d.folder === "client-portal" && d.name !== ".keep") {
          filesList.push(d);
        }
      });
    } else if (path.length === 2) {
      const parentFolder = path[1];
      if (parentFolder === "internal") {
        // client-portal/internal
        documents.forEach((d) => {
          if (d.folder === "client-portal/internal" && d.name !== ".keep") {
            filesList.push(d);
          }
        });
      } else {
        // client-portal/[clientName]
        foldersList.push("internal");
        if (activeClient) {
          const clientProjects = projects.filter((p) => p.clientId === activeClient.id);
          clientProjects.forEach((p) => {
            if (!foldersList.includes(p.name)) foldersList.push(p.name);
          });
        }
        documents.forEach((d) => {
          if (d.folder === `client-portal/${parentFolder}` && d.name !== ".keep") {
            filesList.push(d);
          }
        });
      }
    } else if (path.length === 3) {
      const clientName = path[1];
      const targetFolder = path[2];
      if (activeClient) {
        if (targetFolder === "internal") {
          // client-portal/[clientName]/internal
          const clientProjects = projects.filter((p) => p.clientId === activeClient.id);
          const projectIds = clientProjects.map((p) => p.id);
          documents.forEach((d) => {
            if (
              (projectIds.includes(d.projectId) && !d.shared && d.name !== ".keep") ||
              (d.folder === `client-portal/${clientName}/internal` && d.name !== ".keep")
            ) {
              filesList.push(d);
            }
          });
        } else {
          // client-portal/[clientName]/[projectName]
          if (activeProject) {
            documents.forEach((d) => {
              if (d.projectId === activeProject.id && d.name !== ".keep") {
                filesList.push(d);
              }
            });
          }
        }
      }
    }

    return { subfolders: foldersList, explorerFiles: filesList };
  }, [path, clients, projects, documents, activeClient, activeProject]);

  const filteredSubfolders = useMemo(() => {
    if (!search) return subfolders;
    return subfolders.filter((f) => f.toLowerCase().includes(search.toLowerCase()));
  }, [subfolders, search]);

  const filteredFiles = useMemo(() => {
    if (!search) return explorerFiles;
    return explorerFiles.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [explorerFiles, search]);

  // Folder Click
  const handleFolderClick = (folderName: string) => {
    setPath([...path, folderName]);
  };

  // Upload/New Folder Mock Logic
  const handleUploadMock = () => {
    const name = prompt("Enter file name to upload:");
    if (!name) return;
    const isInternal = activeFolderDisplayPath.includes("internal");
    uploadDocument({
      projectId: activeProject?.id || "",
      name,
      folder: activeFolderDisplayPath,
      shared: !isInternal,
    });
    toast.success(`Uploaded ${name} successfully!`);
  };

  const handleNewFolderMock = () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    uploadDocument({
      projectId: activeProject?.id || "",
      name: ".keep",
      folder: `${activeFolderDisplayPath}/${name}`,
      shared: true,
    });
    toast.success(`Created folder ${name} successfully!`);
  };

  // Disconnected view
  if (!activeConn) {
    return (
      <AppShell title="Files" subtitle="Manage your studio files and cloud storage connections">
        <div className="mx-auto max-w-4xl py-10">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Connect External Storage</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Choose a cloud storage provider to centralize your client deliverables, project files, and internal assets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PROVIDER_METAS.map((prov) => {
              const Icon = prov.logo;
              return (
                <div key={prov.id} className="panel p-6 bg-card border-border/60 flex flex-col justify-between items-start gap-4 hover:border-primary/30 transition-all duration-300">
                  <div className="space-y-3 w-full">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", prov.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{prov.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{prov.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectingProvider(prov.id as any)}
                    className="w-full rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer text-center"
                  >
                    Connect
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connection Dialog */}
        <AppDialog
          open={!!connectingProvider}
          onOpenChange={(v) => !v && setConnectingProvider(null)}
          title={`Connect ${PROVIDER_METAS.find((p) => p.id === connectingProvider)?.name || ""}`}
          description="Enter your administrator email address to initialize the storage link."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email || !connectingProvider) return;
              connectStorage(connectingProvider, email);
              toast.success(`Connected ${PROVIDER_METAS.find((p) => p.id === connectingProvider)?.name} successfully!`);
              setConnectingProvider(null);
              setEmail("");
            }}
            className="space-y-4 p-6"
          >
            <FieldGroup>
              <TextField
                label="Storage Account Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kristal.com"
                required
              />
            </FieldGroup>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setConnectingProvider(null)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Confirm Link
              </button>
            </div>
          </form>
        </AppDialog>
      </AppShell>
    );
  }

  const ConnIcon = PROVIDERS[activeConn.provider]?.icon || Cloud;

  return (
    <AppShell
      title="Files"
      subtitle={`${documents.filter((d) => d.name !== ".keep").length} files managed in external cloud storage`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Settings
          </button>
          <button
            onClick={handleNewFolderMock}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
          >
            <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" /> New folder
          </button>
          <button
            onClick={handleUploadMock}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Upload file
          </button>
        </div>
      }
    >
      {/* Active Storage connection info banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border border-border bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", PROVIDERS[activeConn.provider]?.color)}>
            <ConnIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              Connected to {PROVIDERS[activeConn.provider]?.label}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Syncing account: <span className="font-semibold">{activeConn.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Explorer Breadcrumbs and Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {path.length > 1 && (
            <button
              onClick={() => setPath(path.slice(0, -1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer mr-1"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border border-border/40 w-fit">
            {path.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
                <button
                  onClick={() => setPath(path.slice(0, idx + 1))}
                  className={cn(
                    "hover:text-foreground font-semibold transition-colors cursor-pointer",
                    idx === path.length - 1 ? "text-foreground font-bold" : ""
                  )}
                >
                  {crumb}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory…"
            className="h-9 w-52 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* File Explorer Display */}
      <div>
        {view === "grid" ? (
          <div className="space-y-6">
            {/* Subfolders Grid */}
            {filteredSubfolders.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredSubfolders.map((folder) => (
                  <div
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className="panel p-4 bg-card/50 hover:bg-card hover:border-primary/20 cursor-pointer flex items-center justify-between group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Folder className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[130px]">
                          {folder}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Directory</div>
                      </div>
                    </div>
                    {folder === "internal" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-500/10">
                        <Lock className="h-2.5 w-2.5" /> Private
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Files Grid */}
            {filteredFiles.length > 0 && (
              <div>
                {filteredSubfolders.length > 0 && (
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-3">Files</h4>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="panel p-4 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-36">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/60 text-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{file.size}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              toast.info(`Downloading ${file.name}...`);
                            }}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted cursor-pointer"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              deleteDocument(file.id);
                              toast.success(`Deleted ${file.name}`);
                            }}
                            className="rounded-full p-1 text-rose-600 hover:bg-rose-500/5 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
                        <span>Uploaded {file.uploadedAt}</span>
                        {file.shared ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600">
                            <Eye className="h-2.5 w-2.5" /> Client
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-slate-500">
                            <Lock className="h-2.5 w-2.5" /> Internal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSubfolders.length === 0 && filteredFiles.length === 0 && (
              <div className="panel p-12 text-center text-muted-foreground bg-card/50">
                <Folder className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <div className="text-sm font-semibold text-foreground">Empty Directory</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  No files or directories match your current view. Click 'Upload file' to manually add assets.
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
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Size</th>
                    <th className="px-5 py-3 font-medium">Uploaded</th>
                    <th className="px-5 py-3 font-medium">Visibility</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Folders List in Table */}
                  {filteredSubfolders.map((folder) => (
                    <tr
                      key={folder}
                      onClick={() => handleFolderClick(folder)}
                      className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer group"
                    >
                      <td className="px-5 py-3 font-medium">
                        <span className="inline-flex items-center gap-2.5">
                          <Folder className="h-4 w-4 text-primary" />
                          <span className="group-hover:text-primary transition-colors">{folder}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">Directory</td>
                      <td className="px-5 py-3 text-muted-foreground">—</td>
                      <td className="px-5 py-3 text-muted-foreground">—</td>
                      <td className="px-5 py-3">
                        {folder === "internal" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-500/10">
                            <Lock className="h-2.5 w-2.5" /> Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-500/20">
                            <Eye className="h-2.5 w-2.5" /> Public
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3"></td>
                    </tr>
                  ))}

                  {/* Files List in Table */}
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium">
                        <span className="inline-flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-muted-foreground" />
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`Downloading ${file.name}...`);
                            }}
                            className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                          >
                            Download
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(file.id);
                              toast.success(`Deleted ${file.name}`);
                            }}
                            className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/5 cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSubfolders.length === 0 && filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No files or directories match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Storage Settings Dialog */}
      <AppDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        title="Storage Configuration"
        description="Configure your linked external storage, mappings, and synchronization status."
      >
        <div className="space-y-6 p-6">
          {/* Provider Details */}
          <div className="flex items-center gap-4 border-b border-border/40 pb-4">
            <div className={cn("grid h-12 w-12 place-items-center rounded-2xl border", PROVIDERS[activeConn.provider]?.color)}>
              <ConnIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">{PROVIDERS[activeConn.provider]?.label} Linked</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeConn.email} · Linked on {activeConn.connectedAt || "Just now"}
              </p>
            </div>
          </div>

          {/* Usage Quota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Linked storage quota usage:</span>
              <span className="text-foreground">4.8 GB of 100 GB (4.8%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "4.8%" }} />
            </div>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-between text-xs border-t border-border/40 pt-4">
            <span className="text-muted-foreground font-medium">Sync status:</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active & In Sync
            </span>
          </div>

          {/* Sync Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Last sync run:</span>
            <span className="text-foreground font-medium">Just now</span>
          </div>

          {/* Settings Options (Sharing defaults) */}
          <div className="space-y-3 border-t border-border/40 pt-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sharing defaults</div>
            <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-border bg-card accent-primary" />
              <span>Auto-share new client project files with clients</span>
            </label>
            <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-border bg-card accent-primary" />
              <span>Allow team members to manage private internal directories</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <button
              onClick={() => {
                setSyncing(true);
                setTimeout(() => {
                  setSyncing(false);
                  toast.success("Force storage sync completed!");
                }, 600);
              }}
              disabled={syncing}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing ? "animate-spin" : "")} />
              {syncing ? "Syncing..." : "Re-sync storage"}
            </button>
            <button
              onClick={() => {
                disconnectStorage(activeConn.provider);
                setShowSettings(false);
                toast.success(`Disconnected ${PROVIDERS[activeConn.provider]?.label} storage`);
              }}
              className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 text-xs font-semibold hover:bg-rose-100 cursor-pointer transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      </AppDialog>
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
