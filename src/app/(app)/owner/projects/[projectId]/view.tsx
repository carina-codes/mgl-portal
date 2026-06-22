"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import { useStore, type StorageConnection } from "@/lib/store";
import { useModals } from "@/components/modals";
import {
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  REQUEST_TYPE_META,
  type TaskStage,
  type Task,
  type Comment,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  Plus,
  Share2,
  Settings as SettingsIcon,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Paperclip,
  MessageCircle,
  Calendar as CalendarIcon,
  FolderOpen,
  Clock,
  Coins,
  Briefcase,
  TrendingUp,
  PackageCheck,
  Inbox,
  FileText,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  LayoutDashboard,
  ListTodo,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Send,
  Upload,
  Trash2,
  Table,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  X,
  Edit2,
  Cloud,
  HardDrive,
  RefreshCw,
  ListPlus,
  FolderPlus,
  MessageCircleQuestion,
  HelpCircle,
  Wand2,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AppDialog, TextField, SelectField, FieldGroup, FieldLabel } from "@/components/ui/app-dialog";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { celebrateFromElement } from "@/lib/confetti";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const getFileIcon = (name: string, className?: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  let IconComponent = File;

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "fig"].includes(ext)) {
    IconComponent = FileImage;
  } else if (ext === "pdf" || ["doc", "docx"].includes(ext)) {
    IconComponent = FileText;
  } else if (["xls", "xlsx", "csv"].includes(ext)) {
    IconComponent = FileSpreadsheet;
  } else if (["zip", "rar", "7z", "tar"].includes(ext)) {
    IconComponent = FileArchive;
  } else if (["mp4", "mov", "avi"].includes(ext)) {
    IconComponent = FileVideo;
  } else if (["mp3", "wav", "ogg"].includes(ext)) {
    IconComponent = FileAudio;
  } else if (["html", "css", "js", "ts", "json", "py", "sh", "md"].includes(ext)) {
    IconComponent = FileCode;
  }

  return <IconComponent className={cn(className, "text-foreground")} />;
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Documents", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ProjectDetail() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { open } = useModals();
  
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const allRequests = useStore((s) => s.requests);
  const channels = useStore((s) => s.channels);

  const projectRequestsCount = useMemo(() => {
    return allRequests.filter(
      (r) =>
        r.projectId === projectId &&
        (r.status === "needs_clarification" || r.status === "under_review")
    ).length;
  }, [allRequests, projectId]);

  const hasUnreadChat = useMemo(() => {
    return channels.some((c) => c.projectId === projectId && c.unread > 0);
  }, [channels, projectId]);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => project ? clients.find((c) => c.id === project.clientId) : undefined, [clients, project]);
  
  const [tab, setTab] = useState<TabId>("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (!project) throw notFound();
  if (!client) throw notFound();

  return (
    <AppShell>
      <Link href="/owner/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="panel p-6 bg-card/50 backdrop-blur-sm border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl text-2xl font-bold border transition-all duration-300",
              {
                todo: "bg-todo text-todo-foreground border-todo-foreground/20",
                progress: "bg-progress text-progress-foreground border-progress-foreground/20",
                review: "bg-review text-review-foreground border-review-foreground/20",
                done: "bg-done text-done-foreground border-done-foreground/20",
              }[project.accent] || "bg-muted text-muted-foreground border-muted-foreground/20"
            )}>
              {project.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{client.name}</span> · Timeline:{" "}
                <span className="font-medium text-foreground">{project.startDate} – {project.endDate}</span>
                <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[project.status].cls}`}>
                  {PROJECT_STATUS_META[project.status].label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvatarStack userIds={project.team} users={users} max={4} size={32} />
            <button
              onClick={() => open("project.settings", { projectId: project.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => open("project.share", { projectId: project.id })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 mb-6 flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn( "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50", )}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {t.id === "requests" && projectRequestsCount > 0 && (
                  <span className={cn("absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-[1px]", active ? "bg-white ring-primary" : "bg-primary ring-card")} />
                )}
                {t.id === "chat" && hasUnreadChat && (
                  <span className={cn("absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-[1px]", active ? "bg-white ring-primary" : "bg-primary ring-card")} />
                )}
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {tab === "overview" && <Overview projectId={project.id} />}
        {tab === "tasks" && <TasksTab projectId={project.id} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} />}
        {tab === "requests" && <RequestsTab projectId={project.id} />}
        {tab === "files" && <DocumentsTab projectId={project.id} />}
        {tab === "chat" && <ChatTab projectId={project.id} onOpenTask={setSelectedTaskId} />}
        {tab === "time" && <TimeTab projectId={project.id} onTaskClick={setSelectedTaskId} />}
      </div>

      {/* Hoisted Task Details Drawer */}
      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} hideDiscussion={tab === "chat"} />
    </AppShell>
  );
}

interface LocalDeliverable {
  id: string;
  projectId: string;
  title: string;
  type: "file" | "folder" | "url";
  updatedAt: string;
  notes: string; // rich text HTML
  // Type-specific values:
  fileSource?: "upload" | "app";
  fileName?: string; // name of selected document or uploaded file
  fileSize?: string;
  folderName?: string; // name of selected project folder
  url?: string; // website URL
}

const LOCAL_DELIVERABLES: LocalDeliverable[] = [
  { id: "d1", projectId: "p1", title: "Onboarding Flow SOW", type: "file", updatedAt: "1h ago", fileSource: "app", fileName: "NovaBoard SOW.pdf", fileSize: "428 KB", notes: "<h3>Onboarding flow specification</h3><p>This document details the onboarding flows and wireframe reviews. Client signed off on page transitions on June 12.</p>" },
  { id: "d2", projectId: "p1", title: "Figma Design Prototype", type: "url", updatedAt: "3h ago", url: "https://figma.com/file/novaboard", notes: "<h3>Interactive Figma Prototype</h3><p>Design system components, wireframes, and prototypes. Check the <em>Mobile App UI</em> section for the latest developer handoff files.</p>" },
  { id: "d3", projectId: "p1", title: "Marketing Assets Folder", type: "folder", updatedAt: "Yesterday", folderName: "Brand", notes: "<h3>Brand Assets</h3><p>Includes high-resolution assets, primary logo SVG source files, font files, and color palette specifications.</p>" },
  { id: "d4", projectId: "p2", title: "Pricing page — final", type: "file", updatedAt: "Yesterday", fileSource: "app", fileName: "Sitemap v2.fig", fileSize: "18 MB", notes: "<h3>Sitemap and Pricing Draft</h3><p>Contains details on fixed pricing tables and billing structure drafts.</p>" },
  { id: "d5", projectId: "p4", title: "Northwind wordmark — refinements", type: "file", updatedAt: "2d ago", fileSource: "upload", fileName: "wordmark-kerned.png", fileSize: "1.2 MB", notes: "<h3>Northwind Wordmark Refinements</h3><p>Refinements to characters 'W' and 'd' for balanced optical kerning.</p>" },
  { id: "d6", projectId: "p6", title: "Lumen brand book", type: "file", updatedAt: "4d ago", fileSource: "upload", fileName: "lumen-book-v1.pdf", fileSize: "8.4 MB", notes: "<h3>Lumen Brand Book</h3><p>Full brand identity draft including typography pairings and photo shoot direction guidelines.</p>" },
  { id: "d7", projectId: "p7", title: "Field & Form homepage R1", type: "file", updatedAt: "Today", fileSource: "upload", fileName: "homepage-mockup.png", fileSize: "2.3 MB", notes: "<h3>Editorial Homepage R1</h3><p>First review pass of the homepage layout featuring rich imagery options.</p>" },
];

function Overview({ projectId }: { projectId: string }) {
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const t = useMemo(() => allTasks.filter((x) => x.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);

  const client = useMemo(() => clients.find((c) => c.id === project.clientId), [clients, project.clientId]);
  const clientUser = useMemo(() => {
    if (!client) return undefined;
    return users.find((u) => u.role === "client" && (u.email === client.contactEmail || u.name === client.contact));
  }, [users, client]);

  // Documents list for dropdown select
  const documents = useStore((s) => s.documents);
  const projectDocs = useMemo(() => documents.filter((doc) => doc.projectId === projectId), [documents, projectId]);
  
  // Folders list derived from project documents
  const projectStorageMappings = useStore((s) => s.projectStorageMappings);
  const projectFolders = useMemo(() => {
    const list = Array.from(new Set(projectDocs.map((d) => d.folder)));
    projectStorageMappings.forEach((m) => {
      if (m.projectId === projectId && !list.includes(m.folderName)) list.push(m.folderName);
    });
    return list;
  }, [projectDocs, projectStorageMappings, projectId]);

  const [deliverables, setDeliverables] = useState<LocalDeliverable[]>([]);
  useEffect(() => {
    setDeliverables(LOCAL_DELIVERABLES.filter((d) => d.projectId === projectId));
  }, [projectId]);

  // Edit deliverable modal state
  const [editingDelivId, setEditingDelivId] = useState<string | null>(null);
  const editingDeliv = useMemo(() => deliverables.find((d) => d.id === editingDelivId), [deliverables, editingDelivId]);
  const [editForm, setEditForm] = useState({
    title: "",
    type: "file" as "file" | "folder" | "url",
    fileSource: "upload" as "upload" | "app",
    fileName: "",
    fileSize: "",
    folderName: "",
    url: "",
  });

  const startEdit = (d: LocalDeliverable) => {
    setEditingDelivId(d.id);
    setEditForm({
      title: d.title,
      type: d.type,
      fileSource: d.fileSource || "upload",
      fileName: d.fileName || "",
      fileSize: d.fileSize || "",
      folderName: d.folderName || "",
      url: d.url || "",
    });
  };

  const handleEditSubmit = () => {
    if (!editingDelivId) return;
    if (!editForm.title.trim()) return toast.error("Title is required");

    let fName = "";
    let fSize = "";
    let fldName = "";
    let targetUrl = "";

    if (editForm.type === "file") {
      if (!editForm.fileName.trim()) return toast.error("Please specify or select a file");
      fName = editForm.fileName.trim();
      if (editForm.fileSource === "app") {
        const matchingDoc = projectDocs.find((doc) => doc.name === editForm.fileName);
        if (matchingDoc) fSize = matchingDoc.size;
      } else {
        fSize = editForm.fileSize || "Uploaded";
      }
    } else if (editForm.type === "folder") {
      if (!editForm.folderName.trim()) return toast.error("Please select a project folder");
      fldName = editForm.folderName;
    } else if (editForm.type === "url") {
      if (!editForm.url.trim()) return toast.error("Website URL is required");
      targetUrl = editForm.url.trim();
    }

    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === editingDelivId
          ? {
              ...d,
              title: editForm.title.trim(),
              type: editForm.type,
              updatedAt: "Just now",
              fileSource: editForm.type === "file" ? editForm.fileSource : undefined,
              fileName: editForm.type === "file" ? fName : undefined,
              fileSize: editForm.type === "file" ? fSize : undefined,
              folderName: editForm.type === "folder" ? fldName : undefined,
              url: editForm.type === "url" ? targetUrl : undefined,
            }
          : d
      )
    );
    setEditingDelivId(null);
    toast.success("Deliverable updated");
  };

  const removeDeliverable = (id: string) => {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deliverable removed");
  };

  // View notes details modal state
  const [selectedDelivId, setSelectedDelivId] = useState<string | null>(null);
  const [viewNotes, setViewNotes] = useState("");
  const selectedDeliv = useMemo(() => deliverables.find((d) => d.id === selectedDelivId), [deliverables, selectedDelivId]);

  const openViewDeliv = (d: LocalDeliverable) => {
    setSelectedDelivId(d.id);
    setViewNotes(d.notes || "");
  };

  const saveNotes = () => {
    if (!selectedDelivId) return;
    setDeliverables((prev) =>
      prev.map((d) => (d.id === selectedDelivId ? { ...d, notes: viewNotes } : d))
    );
    toast.success("Notes saved");
  };

  // Add deliverable modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    type: "file" as "file" | "folder" | "url",
    fileSource: "upload" as "upload" | "app",
    fileName: "",
    fileSize: "",
    folderName: "",
    url: "",
    notes: "",
  });

  const handleAddSubmit = () => {
    if (!addForm.title.trim()) return toast.error("Title is required");
    
    let fName = "";
    let fSize = "";
    let fldName = "";
    let targetUrl = "";

    if (addForm.type === "file") {
      if (!addForm.fileName.trim()) return toast.error("Please specify or select a file");
      fName = addForm.fileName.trim();
      
      // If selected from project documents, pull size
      if (addForm.fileSource === "app") {
        const matchingDoc = projectDocs.find((d) => d.name === addForm.fileName);
        if (matchingDoc) fSize = matchingDoc.size;
      } else {
        fSize = addForm.fileSize || "Uploaded";
      }
    } else if (addForm.type === "folder") {
      if (!addForm.folderName.trim()) return toast.error("Please select a project folder");
      fldName = addForm.folderName;
    } else if (addForm.type === "url") {
      if (!addForm.url.trim()) return toast.error("Website URL is required");
      targetUrl = addForm.url.trim();
    }

    const newDeliv: LocalDeliverable = {
      id: `local-d-${Date.now()}`,
      projectId,
      title: addForm.title.trim(),
      type: addForm.type,
      updatedAt: "Just now",
      notes: addForm.notes || "<p>No notes written yet.</p>",
      fileSource: addForm.type === "file" ? addForm.fileSource : undefined,
      fileName: addForm.type === "file" ? fName : undefined,
      fileSize: addForm.type === "file" && fSize ? fSize : undefined,
      folderName: addForm.type === "folder" ? fldName : undefined,
      url: addForm.type === "url" ? targetUrl : undefined,
    };
    
    setDeliverables((prev) => [newDeliv, ...prev]);
    setIsAddOpen(false);
    setAddForm({
      title: "",
      type: "file",
      fileSource: "upload",
      fileName: "",
      fileSize: "",
      folderName: "",
      url: "",
      notes: "",
    });
    toast.success("Deliverable added");
  };

  const getTypeIcon = (type: "file" | "folder" | "url") => {
    switch (type) {
      case "folder":
        return FolderOpen;
      case "url":
        return ExternalLink;
      case "file":
      default:
        return FileText;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="panel p-6 bg-card/60 border-border/60 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <h3 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Project Overview
          </h3>
          {project.description ? (
            <FormattedBody html={project.description} />
          ) : (
            <p className="text-sm text-muted-foreground/60 italic leading-relaxed font-medium">
              No description provided.
            </p>
          )}
        </div>

        <div className="panel p-6 bg-card/60 border-border/60 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Deliverables
            </h3>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add deliverable
            </button>
          </div>
          
          {deliverables.length > 0 ? (
            <div className="divide-y divide-border/40">
              {deliverables.map((d) => {
                const Icon = getTypeIcon(d.type);
                
                return (
                  <div 
                    key={d.id} 
                    onClick={() => openViewDeliv(d)}
                    className="py-3 px-2 -mx-2 rounded-2xl flex items-center justify-between first:pt-2 last:pb-2 gap-4 group transition-colors select-none hover:bg-muted/40 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-muted-foreground shrink-0">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h4 className="text-sm font-semibold text-foreground truncate">{d.title}</h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.type === "url" ? (
                          <span className="truncate max-w-[280px] inline-block align-bottom font-medium text-primary">
                            Link: {d.url}
                          </span>
                        ) : d.type === "folder" ? (
                          <span>Folder: {d.folderName}</span>
                        ) : (
                          <span>File: {d.fileName} {d.fileSize && `(${d.fileSize})`}</span>
                        )}
                        {` · Updated ${d.updatedAt}`}
                      </p>
                    </div>
                    <div 
                      className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => startEdit(d)}
                        className="rounded-xl border border-border/50 bg-background hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => removeDeliverable(d.id)}
                        className="rounded-xl border border-border/50 bg-background hover:text-destructive hover:bg-destructive/10 p-2 text-muted-foreground transition-all cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {d.type === "url" && d.url && (
                        <a 
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-border/50 bg-background hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                          title="Open link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic leading-relaxed font-medium">
              No deliverables uploaded for this project yet.
            </p>
          )}
        </div>

        {isAddOpen && (
          <AppDialog
            open
            onOpenChange={(v) => !v && setIsAddOpen(false)}
            title="Add deliverable"
            description="Create a new deliverable resource. Depending on type, configure link settings below."
            footer={
              <div className="flex w-full justify-end gap-2">
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSubmit}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            }
          >
            <FieldGroup className="space-y-4">
              <TextField 
                label="Deliverable Name" 
                placeholder="e.g. Invoicing wireframes" 
                value={addForm.title} 
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} 
                autoFocus 
              />
              <div className={cn("grid gap-4", addForm.type === "file" ? "grid-cols-2" : "grid-cols-1")}>
                <SelectField 
                  label="Type" 
                  value={addForm.type} 
                  onChange={(e) => setAddForm({ ...addForm, type: e.target.value as any, fileName: "", folderName: "", url: "" })}
                >
                  <option value="file">File</option>
                  <option value="folder">Folder</option>
                  <option value="url">Website URL</option>
                </SelectField>
                
                {addForm.type === "file" && (
                  <SelectField 
                    label="File Source" 
                    value={addForm.fileSource} 
                    onChange={(e) => setAddForm({ ...addForm, fileSource: e.target.value as any, fileName: "", fileSize: "" })}
                  >
                    <option value="upload">Upload new file</option>
                    <option value="app">Choose from project files</option>
                  </SelectField>
                )}
              </div>

              {addForm.type === "file" && addForm.fileSource === "upload" && (
                <div className="space-y-1.5">
                  <FieldLabel>Upload File</FieldLabel>
                  {addForm.fileName ? (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{addForm.fileName}</p>
                          {addForm.fileSize && <p className="text-[11px] text-muted-foreground">{addForm.fileSize}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => setAddForm({ ...addForm, fileName: "", fileSize: "" })}
                        className="rounded-xl hover:bg-muted p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/85 bg-muted/20 p-5 text-center hover:bg-muted/40 hover:border-primary/50 transition-all">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeStr = file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(file.size / 1024).toFixed(0)} KB`;
                            
                            const titleUpdate = addForm.title.trim() 
                              ? addForm.title 
                              : file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            
                            setAddForm({
                              ...addForm,
                              title: titleUpdate,
                              fileName: file.name,
                              fileSize: sizeStr,
                            });
                          }
                        }}
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Click to upload file</span>
                      <span className="text-[10px] text-muted-foreground">Any file up to 50MB</span>
                    </label>
                  )}
                </div>
              )}

              {addForm.type === "file" && addForm.fileSource === "app" && (
                <SelectField 
                  label="Choose Project File" 
                  value={addForm.fileName} 
                  onChange={(e) => setAddForm({ ...addForm, fileName: e.target.value })}
                >
                  <option value="">-- Select a project file --</option>
                  {projectDocs.map((doc) => (
                    <option key={doc.id} value={doc.name}>{doc.name} ({doc.size})</option>
                  ))}
                </SelectField>
              )}

              {addForm.type === "folder" && (
                <SelectField 
                  label="Choose Project Folder" 
                  value={addForm.folderName} 
                  onChange={(e) => setAddForm({ ...addForm, folderName: e.target.value })}
                >
                  <option value="">-- Select a project folder --</option>
                  {projectFolders.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </SelectField>
              )}

              {addForm.type === "url" && (
                <TextField 
                  label="Website URL" 
                  placeholder="https://example.com" 
                  value={addForm.url} 
                  onChange={(e) => setAddForm({ ...addForm, url: e.target.value })} 
                />
              )}

              <div>
                <FieldLabel>Initial Notes</FieldLabel>
                <RichEditor 
                  value={addForm.notes} 
                  onChange={(v) => setAddForm({ ...addForm, notes: v })} 
                  minHeight={100} 
                  placeholder="Goal, context, descriptions..." 
                />
              </div>
            </FieldGroup>
          </AppDialog>
        )}

        {editingDeliv && (
          <AppDialog
            open
            onOpenChange={(v) => !v && setEditingDelivId(null)}
            title="Edit deliverable"
            description="Update this deliverable resource. Depending on type, configure settings below."
            footer={
              <div className="flex w-full justify-end gap-2">
                <button 
                  onClick={() => setEditingDelivId(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSubmit}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            }
          >
            <FieldGroup className="space-y-4">
              <TextField 
                label="Deliverable Name" 
                placeholder="e.g. Invoicing wireframes" 
                value={editForm.title} 
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                autoFocus 
              />
              <div className={cn("grid gap-4", editForm.type === "file" ? "grid-cols-2" : "grid-cols-1")}>
                <SelectField 
                  label="Type" 
                  value={editForm.type} 
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any, fileName: "", folderName: "", url: "" })}
                >
                  <option value="file">File</option>
                  <option value="folder">Folder</option>
                  <option value="url">Website URL</option>
                </SelectField>
                
                {editForm.type === "file" && (
                  <SelectField 
                    label="File Source" 
                    value={editForm.fileSource} 
                    onChange={(e) => setEditForm({ ...editForm, fileSource: e.target.value as any, fileName: "", fileSize: "" })}
                  >
                    <option value="upload">Upload new file</option>
                    <option value="app">Choose from project files</option>
                  </SelectField>
                )}
              </div>

              {editForm.type === "file" && editForm.fileSource === "upload" && (
                <div className="space-y-1.5">
                  <FieldLabel>Upload File</FieldLabel>
                  {editForm.fileName ? (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{editForm.fileName}</p>
                          {editForm.fileSize && <p className="text-[11px] text-muted-foreground">{editForm.fileSize}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditForm({ ...editForm, fileName: "", fileSize: "" })}
                        className="rounded-xl hover:bg-muted p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/85 bg-muted/20 p-5 text-center hover:bg-muted/40 hover:border-primary/50 transition-all">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeStr = file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(file.size / 1024).toFixed(0)} KB`;
                            
                            const titleUpdate = editForm.title.trim() 
                              ? editForm.title 
                              : file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            
                            setEditForm({
                              ...editForm,
                              title: titleUpdate,
                              fileName: file.name,
                              fileSize: sizeStr,
                            });
                          }
                        }}
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Click to upload file</span>
                      <span className="text-[10px] text-muted-foreground">Any file up to 50MB</span>
                    </label>
                  )}
                </div>
              )}

              {editForm.type === "file" && editForm.fileSource === "app" && (
                <SelectField 
                  label="Choose Project File" 
                  value={editForm.fileName} 
                  onChange={(e) => setEditForm({ ...editForm, fileName: e.target.value })}
                >
                  <option value="">-- Select a project file --</option>
                  {projectDocs.map((doc) => (
                    <option key={doc.id} value={doc.name}>{doc.name} ({doc.size})</option>
                  ))}
                </SelectField>
              )}

              {editForm.type === "folder" && (
                <SelectField 
                  label="Choose Project Folder" 
                  value={editForm.folderName} 
                  onChange={(e) => setEditForm({ ...editForm, folderName: e.target.value })}
                >
                  <option value="">-- Select a project folder --</option>
                  {projectFolders.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </SelectField>
              )}

              {editForm.type === "url" && (
                <TextField 
                  label="Website URL" 
                  placeholder="https://example.com" 
                  value={editForm.url} 
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} 
                />
              )}
            </FieldGroup>
          </AppDialog>
        )}

        {selectedDeliv && (
          <AppDialog
            open
            onOpenChange={(v) => !v && setSelectedDelivId(null)}
            title={selectedDeliv.title}
            description={`Deliverable details — Type: ${selectedDeliv.type.toUpperCase()}`}
            footer={
              <div className="flex w-full justify-end gap-2">
                <button 
                  onClick={() => setSelectedDelivId(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    saveNotes();
                    setSelectedDelivId(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Save notes
                </button>
              </div>
            }
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Linked Resource
                </div>
                
                {selectedDeliv.type === "file" && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold truncate">{selectedDeliv.fileName || "No file linked"}</span>
                    {selectedDeliv.fileSize && (
                      <span className="text-xs text-muted-foreground">({selectedDeliv.fileSize})</span>
                    )}
                  </div>
                )}
                
                {selectedDeliv.type === "folder" && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold truncate">Folder: {selectedDeliv.folderName || "No folder selected"}</span>
                  </div>
                )}
                
                {selectedDeliv.type === "url" && (
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-semibold truncate">{selectedDeliv.url || "No URL provided"}</span>
                    </div>
                    {selectedDeliv.url && (
                      <a 
                        href={selectedDeliv.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        Visit site <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <FieldLabel>Rich Text Notes</FieldLabel>
                <RichEditor 
                  value={viewNotes} 
                  onChange={setViewNotes} 
                  minHeight={180} 
                  placeholder="Write rich text notes about this deliverable..." 
                />
              </div>
            </div>
          </AppDialog>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox
            label="Progress"
            value={`${project.progress}%`}
            description="Completion rate"
            icon={TrendingUp}
            progress={project.progress}
            colorCls={{
              text: "text-amber-500 dark:text-amber-400",
              bg: "group-hover:bg-amber-500/10 group-hover:text-amber-500",
              dot: "bg-amber-500",
              hover: "hover:bg-amber-500/[0.03] hover:border-amber-500/25",
            }}
          />
          <StatBox
            label="Hours Logged"
            value={`${project.hoursLogged}h`}
            description={`of ${project.hoursEstimate}h est.`}
            icon={Clock}
            progress={Math.min((project.hoursLogged / project.hoursEstimate) * 100, 100)}
            colorCls={{
              text: "text-sky-500 dark:text-sky-400",
              bg: "group-hover:bg-sky-500/10 group-hover:text-sky-500",
              dot: "bg-sky-500",
              hover: "hover:bg-sky-500/[0.03] hover:border-sky-500/25",
            }}
          />
          <StatBox
            label="Spent Budget"
            value={`$${(project.spent / 1000).toFixed(0)}k`}
            description={`of $${(project.budget / 1000).toFixed(0)}k`}
            icon={Coins}
            progress={Math.min((project.spent / project.budget) * 100, 100)}
            colorCls={{
              text: "text-emerald-500 dark:text-emerald-400",
              bg: "group-hover:bg-emerald-500/10 group-hover:text-emerald-500",
              dot: "bg-emerald-500",
              hover: "hover:bg-emerald-500/[0.03] hover:border-emerald-500/25",
            }}
          />
          <StatBox
            label="Billing Type"
            value={project.type === "fixed" ? "Fixed Price" : "Hourly"}
            description="Billing structure"
            icon={Briefcase}
            colorCls={{
              text: "text-rose-500 dark:text-rose-400",
              bg: "group-hover:bg-rose-500/10 group-hover:text-rose-500",
              dot: "bg-rose-500",
              hover: "hover:bg-rose-500/[0.03] hover:border-rose-500/25",
            }}
          />
        </div>
        <div className="panel p-6 bg-card border-border/60">
          {(() => {
            const totalTasks = t.length;
            const breakdown = (["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => {
              const count = t.filter((x) => x.stage === s).length;
              const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              return { stage: s, count, pct };
            });

            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Task breakdown</h3>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                    {totalTasks} total {totalTasks === 1 ? "task" : "tasks"}
                  </span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-muted/50 flex">
                  {breakdown.map(({ stage, count, pct }) => {
                    if (count === 0) return null;
                    
                    const colorCls = {
                      todo: "bg-rose-400 dark:bg-rose-500",
                      in_progress: "bg-amber-400 dark:bg-amber-500",
                      in_review: "bg-sky-400 dark:bg-sky-500",
                      completed: "bg-emerald-400 dark:bg-emerald-500"
                    }[stage];

                    return (
                      <div
                        key={stage}
                        style={{ width: `${pct}%` }}
                        className={cn("h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full border-r border-background/20 last:border-0", colorCls)}
                        title={`${STAGE_META[stage].label}: ${count} tasks (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Grid Cards */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {breakdown.map(({ stage, count, pct }) => {
                    const meta = STAGE_META[stage];
                    
                    const styles = {
                      todo: {
                        dot: "bg-rose-400",
                        bg: "hover:bg-rose-500/[0.03] hover:border-rose-500/25",
                      },
                      in_progress: {
                        dot: "bg-amber-400",
                        bg: "hover:bg-amber-500/[0.03] hover:border-amber-500/25",
                      },
                      in_review: {
                        dot: "bg-sky-400",
                        bg: "hover:bg-sky-500/[0.03] hover:border-sky-500/25",
                      },
                      completed: {
                        dot: "bg-emerald-400",
                        bg: "hover:bg-emerald-500/[0.03] hover:border-emerald-500/25",
                      },
                    }[stage];

                    return (
                      <div
                        key={stage}
                        className={cn(
                          "rounded-2xl border border-border/40 bg-background/50 p-4 transition-all duration-300 flex flex-col justify-between group select-none",
                          styles.bg
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                            {meta.label}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="mt-3.5 flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-foreground">
                            {count}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            {count === 1 ? "task" : "tasks"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>
      <div className="space-y-6">
        <div className="panel p-6 bg-card border-border/60">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Team</h3>
          <div className="space-y-3">
            {project.team.map((id) => {
              const u = users.find((x) => x.id === id)!;
              return (
                <div key={id} className="flex items-center gap-3">
                  <UserAvatar user={u} size={32} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.title}</div>
                  </div>
                  {id === project.lead && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Lead</span>
                  )}
                </div>
              );
            })}
            
            {clientUser && (
              <div className="flex items-center gap-3 border-t border-border/40 pt-3 mt-3">
                <UserAvatar user={clientUser} size={32} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{clientUser.name}</div>
                  <div className="text-xs text-muted-foreground">{clientUser.title}</div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Client</span>
              </div>
            )}
          </div>
        </div>
        <div className="panel p-6 bg-card border-border/60">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Key dates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kickoff</span>
              <span className="font-medium">{project.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target launch</span>
              <span className="font-medium">{project.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next milestone</span>
              <span className="font-medium">Client demo · Jun 20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  description,
  icon: Icon,
  colorCls,
  progress,
}: {
  label: string;
  value: string;
  description?: string;
  icon: React.ComponentType<any>;
  colorCls: { text: string; bg: string; dot: string; hover: string };
  progress?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/75 backdrop-blur-sm p-4 transition-all duration-300 flex flex-col justify-between group select-none",
        colorCls.hover
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-colors group-hover:text-foreground", colorCls.bg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
        {description && (
          <div className="mt-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {description}
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-2.5 h-1 w-full bg-muted/50 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", colorCls.dot)} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Tasks Tab (Kanban / List / Calendar Switcher) ───── */

function TasksTab({
  projectId,
  selectedTaskId,
  setSelectedTaskId,
}: {
  projectId: string;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}) {
  const [activeView, setActiveView] = useState<"board" | "list" | "calendar">("board");
  const [query, setQuery] = useState("");
  
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const createTask = useStore((s) => s.createTask);
  const updateTask = useStore((s) => s.updateTask);
  const users = useStore((s) => s.users);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    stage: "todo" as TaskStage,
    priority: "medium" as Task["priority"],
  });

  const stages: TaskStage[] = ["todo", "in_progress", "in_review", "completed"];

  function handleCreateTask() {
    if (!newTask.title.trim()) {
      toast.error("Add a title for your task");
      return;
    }
    const created = createTask({
      projectId,
      title: newTask.title.trim(),
      note: newTask.description.replace(/<[^>]+>/g, "").slice(0, 140),
      stage: newTask.stage,
      priority: newTask.priority,
      progress: newTask.stage === "completed" ? 100 : 0,
      assignees: [],
    });
    setNewTask({ title: "", description: "", stage: "todo", priority: "medium" });
    setNewTaskOpen(false);
    toast.success("Task created", { description: created.title });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2.5 rounded-2xl border border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setActiveView("board")}
              className={cn( "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", activeView === "board" ? "bg-primary text-primary-foreground " : "text-muted-foreground hover:text-foreground" )}
            >
              Board
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={cn( "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", activeView === "list" ? "bg-primary text-primary-foreground " : "text-muted-foreground hover:text-foreground" )}
            >
              List
            </button>
            <button
              onClick={() => setActiveView("calendar")}
              className={cn( "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", activeView === "calendar" ? "bg-primary text-primary-foreground " : "text-muted-foreground hover:text-foreground" )}
            >
              Calendar
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-9 w-48 sm:w-56 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => setNewTaskOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add task
        </button>
      </div>

      {activeView === "board" && (
        <KanbanBoardView
          projectId={projectId}
          query={query}
          onCardClick={setSelectedTaskId}
          setNewTaskStage={(stage) => setNewTask((n) => ({ ...n, stage }))}
          setNewTaskOpen={setNewTaskOpen}
        />
      )}

      {activeView === "list" && (
        <TasksListView
          projectId={projectId}
          query={query}
          onCardClick={setSelectedTaskId}
        />
      )}

      {activeView === "calendar" && (
        <TasksCalendarView
          projectId={projectId}
          query={query}
          onCardClick={setSelectedTaskId}
        />
      )}



      {/* Create Task Dialog */}
      <AppDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        title="New task"
        description="Describe the work, assign a stage, and route it to the right person."
        icon={<ListTodo className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              onClick={() => setNewTaskOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Create task
            </button>
          </div>
        }
      >
        <FieldGroup>
          <TextField
            label="Title"
            placeholder="e.g. Polish hero animation timing"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            autoFocus
          />
          <div>
            <FieldLabel>Description</FieldLabel>
            <RichEditor
              value={newTask.description}
              onChange={(html) => setNewTask({ ...newTask, description: html })}
              placeholder="Add context, links, or @mention a teammate…"
              minHeight={140}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Stage"
              value={newTask.stage}
              onChange={(e) => setNewTask({ ...newTask, stage: e.target.value as TaskStage })}
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </SelectField>
          </div>
        </FieldGroup>
      </AppDialog>
    </>
  );
}

/* ───── 2.1 Kanban Board View ───── */

function KanbanBoardView({
  projectId,
  query,
  onCardClick,
  setNewTaskStage,
  setNewTaskOpen,
}: {
  projectId: string;
  query: string;
  onCardClick: (id: string) => void;
  setNewTaskStage: (stage: TaskStage) => void;
  setNewTaskOpen: (open: boolean) => void;
}) {
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const updateTask = useStore((s) => s.updateTask);
  const [dragId, setDragId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const stages: TaskStage[] = ["todo", "in_progress", "in_review", "completed"];

  function onDrop(stage: TaskStage) {
    if (!dragId) return;
    const movedId = dragId;
    updateTask(movedId, { stage, progress: stage === "completed" ? 100 : undefined });
    setDragId(null);
    if (stage === "completed") {
      const task = tasks.find((t) => t.id === movedId);
      requestAnimationFrame(() => {
        celebrateFromElement(cardRefs.current[movedId] ?? null);
        toast.success("Task completed", {
          description: task?.title ?? "Nice work — momentum 🚀",
        });
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stages.map((stage) => {
        const stageTasks = tasks.filter(
          (t) => t.stage === stage && (!query || t.title.toLowerCase().includes(query.toLowerCase())),
        );
        const meta = STAGE_META[stage];
        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(stage)}
            className={cn(`${meta.tone} rounded-3xl p-4 border border-border/10 transition-colors`)}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${meta.pill}`}>
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
                <span className="ml-1 rounded-full bg-white/60 dark:bg-black/20 px-1.5 py-0.5 text-[10px]">{stageTasks.length}</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground cursor-pointer"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {stageTasks.map((task) => (
                <div key={task.id} onClick={() => onCardClick(task.id)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                  <KanbanCard
                    task={task}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    setRef={(el) => (cardRefs.current[task.id] = el)}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setNewTaskStage(stage);
                  setNewTaskOpen(true);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-foreground/15 bg-white/40 dark:bg-card/20 py-2 text-xs text-muted-foreground hover:bg-white/70 dark:hover:bg-card/40 cursor-pointer transition-colors"
              >
                <Plus className="h-3 w-3" /> Add task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  task,
  draggable,
  onDragStart,
  setRef,
}: {
  task: Task;
  draggable?: boolean;
  onDragStart?: () => void;
  setRef?: (el: HTMLDivElement | null) => void;
}) {
  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
  const users = useStore((s) => s.users);
  return (
    <div
      ref={setRef}
      draggable={draggable}
      onDragStart={onDragStart}
      className="cursor-grab rounded-2xl bg-card border border-border/50 p-4 transition-all active:cursor-grabbing"
    >
      <div className="flex justify-between items-center gap-2">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${pmeta.cls}`}>
          {pmeta.label}
        </span>
        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
            {task.dueDate}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm font-semibold leading-snug text-foreground">{task.title}</div>
      {task.note && (
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.note.replace(/<[^>]+>/g, "").trim()}
        </div>
      )}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span>{task.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${task.progress}%` }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <AvatarStack userIds={task.assignees} users={users} max={3} size={22} />
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{task.attachments}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{task.comments}</span>
        </div>
      </div>
    </div>
  );
}

/* ───── 2.2 List View ───── */

function TasksListView({
  projectId,
  query,
  onCardClick,
}: {
  projectId: string;
  query: string;
  onCardClick: (id: string) => void;
}) {
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);

  // Sorting
  const [sortBy, setSortBy] = useState<"title" | "stage" | "priority" | "dueDate">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, query]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: string | number = a[sortBy] || "";
      let valB: string | number = b[sortBy] || "";
      
      if (sortBy === "priority") {
        const priorities: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
        valA = priorities[a.priority] || 0;
        valB = priorities[b.priority] || 0;
      } else if (sortBy === "stage") {
        const stages: Record<string, number> = { todo: 1, in_progress: 2, in_review: 3, completed: 4 };
        valA = stages[a.stage] || 0;
        valB = stages[b.stage] || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="panel p-8 text-center text-muted-foreground bg-card/60">
        No tasks found matching your filter criteria.
      </div>
    );
  }

  return (
    <div className="panel bg-card border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground bg-muted/20">
          <tr className="border-b border-border">
            <th onClick={() => handleSort("title")} className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none">
              Task Name {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 font-medium select-none">Assignees</th>
            <th onClick={() => handleSort("stage")} className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none">
              Status {sortBy === "stage" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("priority")} className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none">
              Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("dueDate")} className="px-4 py-3 font-medium cursor-pointer hover:text-foreground select-none">
              Due Date {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 font-medium text-right select-none">Stats</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((t) => {
            const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
            return (
              <tr
                key={t.id}
                onClick={() => onCardClick(t.id)}
                className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.title}</td>
                <td className="px-4 py-3">
                  <AvatarStack userIds={t.assignees} users={users} max={3} size={22} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-card border border-border", STAGE_META[t.stage].pill)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_META[t.stage].dot)} />
                    {STAGE_META[t.stage].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pmeta.cls}`}>
                    {pmeta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.dueDate || "—"}</td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{t.attachments}</span>
                    <span className="inline-flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{t.comments}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ───── 2.3 Calendar View ───── */

function TasksCalendarView({
  projectId,
  query,
  onCardClick,
}: {
  projectId: string;
  query: string;
  onCardClick: (id: string) => void;
}) {
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const updateTask = useStore((s) => s.updateTask);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June is index 5 (0-indexed)

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate days
  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const arr: Array<{ day: number; currentMonth: boolean; dateString: string }> = [];

    // Preceding month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      arr.push({
        day: dayNum,
        currentMonth: false,
        dateString: `${monthNames[pMonth].slice(0, 3)} ${dayNum.toString().padStart(2, "0")}`,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      arr.push({
        day: d,
        currentMonth: true,
        dateString: `${monthNames[currentMonth].slice(0, 3)} ${d.toString().padStart(2, "0")}`,
      });
    }

    // Succeeding month padding
    const remaining = 42 - arr.length;
    for (let d = 1; d <= remaining; d++) {
      const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      arr.push({
        day: d,
        currentMonth: false,
        dateString: `${monthNames[nMonth].slice(0, 3)} ${d.toString().padStart(2, "0")}`,
      });
    }

    return arr;
  }, [currentYear, currentMonth]);

  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const todayDate = useMemo(() => new Date(), []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="panel p-5 bg-card border-border/60 rounded-3xl">
      {/* Header section with Calendar title & navigate buttons */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">Drag and drop cards to reschedule tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-1 border border-border/80 rounded-xl p-1 bg-muted/20">
          <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(todayDate.getMonth());
              setCurrentYear(todayDate.getFullYear());
            }}
            className="px-3 h-7 flex items-center justify-center text-xs font-bold hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            Today
          </button>
          <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week days layout */}
      <div className="grid grid-cols-7 gap-1.5 bg-muted/40 rounded-2xl p-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-3">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 bg-muted/5 p-1.5 rounded-2xl border border-border/50">
        {days.map((cell, idx) => {
          // Find tasks that fall on this day
          const cellTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
            
            // Clean formats: "Jun 14", "Jun 09" etc.
            const cellClean = cell.dateString.toLowerCase().replace(/\s+/g, "").replace(/\s*0(\d)/, "$1");
            const taskClean = t.dueDate.toLowerCase().replace(/\s+/g, "").replace(/\s*0(\d)/, "$1");
            return cellClean === taskClean;
          });

          const isToday =
            todayDate.getFullYear() === currentYear &&
            todayDate.getMonth() === currentMonth &&
            cell.currentMonth &&
            cell.day === todayDate.getDate();

          return (
            <div
              key={idx}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragTaskId) {
                  updateTask(dragTaskId, { dueDate: cell.dateString });
                  toast.success(`Task rescheduled to ${cell.dateString}`);
                  setDragTaskId(null);
                }
              }}
              className={cn(
                "min-h-[125px] rounded-xl border p-2 bg-card flex flex-col transition-all relative",
                !cell.currentMonth 
                  ? "bg-muted/10 text-muted-foreground/40 border-border/20 border-dashed" 
                  : "border-border/40 hover:border-primary/20 hover:bg-muted/5",
                isToday && "ring-2 ring-primary/40 border-primary bg-primary/5"
              )}
            >
              {/* Day info top row */}
              <div className="flex justify-between items-center mb-2 select-none">
                {isToday ? (
                  <span className="h-5.5 w-5.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                    {cell.day}
                  </span>
                ) : (
                  <span className={cn(
                    "text-[10px] font-semibold",
                    cell.currentMonth ? "text-foreground/80" : "text-muted-foreground/45"
                  )}>
                    {cell.day}
                  </span>
                )}
                {cellTasks.length > 0 && (
                  <span className="text-[9px] font-medium text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-md leading-none">
                    {cellTasks.length}
                  </span>
                )}
              </div>

              {/* Task list inside cells */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin">
                {cellTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragTaskId(t.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(t.id);
                    }}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-semibold whitespace-normal line-clamp-2 break-words leading-snug cursor-pointer transition-all border border-border/30 hover:scale-[1.01] active:scale-95 flex items-start gap-1.5",
                      STAGE_META[t.stage].tone,
                      STAGE_META[t.stage].pill
                    )}
                    title={t.title}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full mt-1 shrink-0", STAGE_META[t.stage].dot)} />
                    <span className="truncate flex-1">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───── 2.4 Task Details Drawer ───── */

function parseDateToInputVal(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const monthAbbrev = parts[0].toLowerCase().slice(0, 3);
    const month = months[monthAbbrev];
    const day = parts[1].replace(/\D/g, "").padStart(2, "0");
    if (month && day) {
      return `2026-${month}-${day}`;
    }
  }
  return "";
}

function formatToMockDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${monthNames[monthIdx]} ${day.toString().padStart(2, "0")}`;
    }
  }
  return dateStr;
}

function TaskDetailsDrawer({
  taskId,
  onClose,
  hideDiscussion = false,
}: {
  taskId: string | null;
  onClose: () => void;
  hideDiscussion?: boolean;
}) {
  const tasks = useStore((s) => s.tasks);
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const updateTask = useStore((s) => s.updateTask);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === taskId), [allComments, taskId]);

  const logTime = useStore((s) => s.logTime);
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry);
  const allTimeEntries = useStore((s) => s.timeEntries);
  const { open } = useModals();
  const taskEntries = useMemo(() => allTimeEntries.filter((te) => task && te.taskId === task.id), [allTimeEntries, task]);
  const taskHours = useMemo(() => taskEntries.reduce((sum, e) => sum + e.hours, 0), [taskEntries]);

  const [logHours, setLogHours] = useState<number>(0);
  const [logNote, setLogNote] = useState("");
  const [logBillable, setLogBillable] = useState(true);

  const teamMembers = users.filter((u) => u.role !== "client");

  const handleLogTime = () => {
    if (!task || logHours <= 0) return;
    logTime({
      userId: "u1", // Owner: Carina Rivera
      projectId: task.projectId,
      taskId: task.id,
      hours: logHours,
      note: logNote.trim() || `Worked on task: ${task.title}`,
      billable: logBillable,
      date: new Date().toISOString().slice(0, 10),
    });
    setLogHours(0);
    setLogNote("");
    setLogBillable(true);
    toast.success(`Logged ${logHours}h on task`);
  };

  if (!task) return null;

  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
          <SheetDescription className="sr-only">View and edit details for task {task.title}</SheetDescription>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pmeta.cls)}>
              {pmeta.label}
            </span>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", STAGE_META[task.stage].tone, STAGE_META[task.stage].pill)}>
              {STAGE_META[task.stage].label}
            </span>
          </div>
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-primary rounded-xl px-1 text-foreground"
          />
          {task.createdAt && (
            <div className="text-xs text-muted-foreground mt-1.5 px-1">
              Created on{" "}
              {new Date(task.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}
        </SheetHeader>

        {/* Form fields */}
        <div className="space-y-4 text-sm border-b border-border pb-6 mb-6">
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={task.stage}
              onChange={(e) => updateTask(task.id, { stage: e.target.value as TaskStage })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              {(["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => (
                <option key={s} value={s}>{STAGE_META[s].label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Priority:</span>
            <select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Due Date:</span>
            <input
              type="date"
              value={parseDateToInputVal(task.dueDate)}
              onChange={(e) => updateTask(task.id, { dueDate: formatToMockDate(e.target.value) })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Start Date:</span>
            <input
              type="date"
              value={task.startDate ?? ""}
              onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Est. Hours:</span>
            <input
              type="number"
              value={task.estimatedHours ?? 0}
              onChange={(e) => updateTask(task.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Client Priority:</span>
            <select
              value={task.customFields?.["Client Priority"] ?? "Normal"}
              onChange={(e) => {
                const nextCustom = { ...(task.customFields ?? {}), "Client Priority": e.target.value };
                updateTask(task.id, { customFields: nextCustom });
              }}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-start">
            <span className="text-muted-foreground font-medium pt-1">Assignees:</span>
            <div className="col-span-2 rounded-xl border border-border bg-background p-2 max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {[...teamMembers]
                .sort((a, b) => {
                  const aAssigned = task.assignees.includes(a.id);
                  const bAssigned = task.assignees.includes(b.id);
                  if (aAssigned && !bAssigned) return -1;
                  if (!aAssigned && bAssigned) return 1;
                  return 0;
                })
                .map((m) => {
                  const assigned = task.assignees.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        "flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all p-1.5 rounded-lg hover:bg-muted/60",
                        assigned ? "text-primary bg-primary/5" : "text-foreground"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => {
                          const next = assigned
                            ? task.assignees.filter((id) => id !== m.id)
                            : [...task.assignees, m.id];
                          updateTask(task.id, { assignees: next });
                        }}
                        className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                      />
                      <UserAvatar user={m} size={20} />
                      <span className="truncate">{m.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Logged Time:</span>
            <div className="col-span-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs bg-primary/10 text-primary">
                {taskHours.toFixed(1)}h
              </span>
              <span className="text-xs text-muted-foreground">
                of {task.estimatedHours || 0}h estimated
              </span>
              {(task.estimatedHours ?? 0) > 0 && (
                <div className="flex-1 max-w-[80px] h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, (taskHours / (task.estimatedHours ?? 1)) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
          <RichEditor
            value={task.note}
            onChange={(v) => updateTask(task.id, { note: v })}
            placeholder="Add detailed description notes here..."
            minHeight={120}
          />
        </div>

        {/* Task Time Tracker Section */}
        <div className="border-t border-border/80 pt-6 mt-6 mb-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Task Time Tracker</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {taskEntries.length} {taskEntries.length === 1 ? "log" : "logs"}
            </span>
          </h4>

          {/* Form to log time inline */}
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/40 mb-4">
            <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Log Time on this Task
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="0.00"
                  value={logHours === 0 ? "" : logHours}
                  onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-foreground"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Work Done Note</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-foreground"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={logBillable}
                  onChange={(e) => setLogBillable(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                />
                Billable
              </label>
              
              <button
                onClick={handleLogTime}
                disabled={logHours <= 0}
                className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Log Hours
              </button>
            </div>
          </div>

          {/* Time entries list for this task */}
          {taskEntries.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {taskEntries.map((e) => {
                const u = users.find((x) => x.id === e.userId);
                if (!u) return null;
                return (
                  <div key={e.id} className="flex items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-2.5 rounded-xl transition-all group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={u} size={20} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground truncate">{u.name.split(" ")[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{e.date}</span>
                          {e.billable ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/10">Billable</span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-500/10 px-1 py-0.2 rounded border border-slate-500/10">Non-billable</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[280px]" title={e.note}>
                          {e.note || <span className="italic text-muted-foreground/30">No description note</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-lg font-mono whitespace-nowrap">{e.hours.toFixed(2)}h</span>
                      <button
                        onClick={() => open("time.delete", { timeId: e.id })}
                        className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete time entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
              No time entries logged on this task yet.
            </div>
          )}
        </div>

        {/* Discussion Feed */}
        {!hideDiscussion && (
          <div className="border-t border-border/80 pt-6">
            <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center justify-between">
              <span>Thread Discussion</span>
              <span className="text-xs text-muted-foreground font-normal">{comments.length} comments</span>
            </h4>
            <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
              {comments.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
                  No discussion comments yet. Write one below!
                </div>
              ) : (
                comments.map((c) => {
                  const u = users.find((x) => x.id === c.author);
                  const isInternal = c.visibility === "internal";
                  if (!u) return null;
                  return (
                    <div key={c.id} className="flex gap-2.5 text-xs">
                      <UserAvatar user={u} size={24} />
                      <div className={cn("flex-1 rounded-2xl px-3.5 py-2.5", isInternal ? "bg-amber-500/10 border border-amber-500/25" : "bg-muted")}>
                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{u.name}</span>
                          <span>{c.createdAt}</span>
                        </div>
                        <FormattedBody html={c.body} />
                        <CommentAttachmentsList attachmentIds={c.attachments} />
                        {isInternal && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                            <Lock className="h-2 w-2" /> Internal note
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form */}
            <NewCommentForm threadId={task.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function NewCommentForm({ threadId }: { threadId: string }) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const projectId = useStore((s) => s.tasks.find((t) => t.id === threadId)?.projectId || "p1");

  const handleSubmit = () => {
    if (!commentText.trim() && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: !isInternal,
      });
      return doc.id;
    });

    createComment({
      threadId,
      author: "u1", // Owner: Carina Rivera
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
      attachments: docIds,
    });
    setCommentText("");
    setAttachments([]);
    toast.success("Comment posted successfully");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0 || attachments.length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      placeholder="Post a reply..."
      minHeight={80}
      compact
      onSend={handleSubmit}
      sendDisabled={!isEnabled}
      showInternalOnly
      isInternal={isInternal}
      onInternalChange={setIsInternal}
    />
  );
}

/* ───── Requests Tab ───── */

const TYPE_ICONS: Record<string, any> = {
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
};

function RequestsTab({ projectId }: { projectId: string }) {
  const allRequests = useStore((s) => s.requests);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const requests = useMemo(() => allRequests.filter((r) => r.projectId === projectId), [allRequests, projectId]);
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {requests.length === 0 && <EmptyState icon={Inbox} label="No requests for this project yet" />}
      {requests.map((r) => {
        const submitter = users.find((u) => u.id === r.submittedBy);
        const sm = REQUEST_STATUS_META[r.status];
        const tm = REQUEST_TYPE_META[r.type];
        const pm = PRIORITY_META[r.priority];
        const TypeIcon = TYPE_ICONS[tm.icon] || HelpCircle;

        const accentCls = {
          submitted: {
            cardHover: "hover:border-sky-500/25",
            glow: "bg-sky-500/5 group-hover:bg-sky-500/10",
            badge: "bg-review text-review-foreground border-review-foreground/20",
            textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
          },
          needs_clarification: {
            cardHover: "hover:border-amber-500/25",
            glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
            badge: "bg-progress text-progress-foreground border-progress-foreground/20",
            textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
          },
          under_review: {
            cardHover: "hover:border-violet-500/25",
            glow: "bg-violet-500/5 group-hover:bg-violet-500/10",
            badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
            textHover: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
          },
          approved: {
            cardHover: "hover:border-emerald-500/25",
            glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
            badge: "bg-done text-done-foreground border-done-foreground/20",
            textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
          },
          rejected: {
            cardHover: "hover:border-rose-500/25",
            glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
            badge: "bg-todo text-todo-foreground border-todo-foreground/20",
            textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
          },
          converted_task: {
            cardHover: "hover:border-blue-500/25",
            glow: "bg-blue-500/5 group-hover:bg-blue-500/10",
            badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          },
          converted_project: {
            cardHover: "hover:border-blue-500/25",
            glow: "bg-blue-500/5 group-hover:bg-blue-500/10",
            badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          },
        }[r.status] || {
          cardHover: "hover:border-primary/25",
          glow: "bg-primary/5 group-hover:bg-primary/10",
          badge: "bg-muted text-muted-foreground border-muted-foreground/20",
          textHover: "group-hover:text-primary",
        };

        return (
          <div key={r.id} className={cn("group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}>
            <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />

            <div className="space-y-4">
              {/* Top Header Row: Icon Badge + Title */}
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                  accentCls.badge
                )}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => open("request.review", { requestId: r.id })}
                    className="text-left block w-full group/title cursor-pointer"
                  >
                    <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2 hover:underline decoration-1", accentCls.textHover)}>
                      {r.title}
                    </h3>
                  </button>
                </div>
              </div>

              {/* Status & Priority Row */}
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => open("request.review", { requestId: r.id })}
                    className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-90", sm.cls)}
                  >
                    {sm.label}
                  </button>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>
                    {pm.label}
                  </span>
                </div>
                <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                  {tm.label}
                </span>
              </div>

              {/* Description & Submission info */}
              <div className="space-y-2.5">
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {r.description}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Submitted {r.submittedAt}</span>
                  {r.estimatedHours && (
                    <>
                      <span className="text-muted-foreground/30">•</span>
                      <span>Est: {r.estimatedHours}h</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Section: Submitter & Action Buttons */}
            <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="flex items-center gap-2">
                {submitter && <UserAvatar user={submitter} size={26} />}
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  {submitter?.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => open("request.review", { requestId: r.id })}
                  className="rounded-full border border-border/50 bg-background/30 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───── Centralized Documents Tab ───── */

function DocumentsTab({ projectId }: { projectId: string }) {
  const allDocuments = useStore((s) => s.documents);
  const documents = useMemo(() => allDocuments.filter((d) => d.projectId === projectId && d.name !== ".keep"), [allDocuments, projectId]);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const renameDocument = useStore((s) => s.renameDocument);
  const toggleDocumentShared = useStore((s) => s.toggleDocumentShared);
  const users = useStore((s) => s.users);
  
  const allMappings = useStore((s) => s.projectStorageMappings);
  const projectStorageMappings = useMemo(
    () => allMappings.filter((m) => m.projectId === projectId),
    [allMappings, projectId]
  );
  const unmapProjectStorage = useStore((s) => s.unmapProjectStorage);
  const { open } = useModals();

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [fileQuery, setFileQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Inline Renaming States
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");
  const [validationError, setValidationError] = useState(false);

  const folders = useMemo(() => {
    const list = Array.from(new Set(documents.map((d) => d.folder)));
    projectStorageMappings.forEach((m) => {
      if (!list.includes(m.folderName)) list.push(m.folderName);
    });
    return list;
  }, [documents, projectStorageMappings]);

  const allFiles = useMemo(() => {
    const arr: Array<{
      id: string;
      name: string;
      size: string;
      folder: string;
      uploadedBy: string;
      uploadedAt: string;
      shared: boolean;
      type: "document";
      thumbnail?: string;
      previewUrl?: string;
    }> = [];

    documents.forEach((d) => {
      arr.push({
        id: d.id,
        name: d.name,
        size: d.size,
        folder: d.folder,
        uploadedBy: d.uploadedBy,
        uploadedAt: d.uploadedAt,
        shared: d.shared,
        type: "document",
        previewUrl: d.previewUrl,
      });
    });

    return arr;
  }, [documents]);

  const filteredFiles = useMemo(() => {
    return allFiles.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(fileQuery.toLowerCase());
      const matchFolder = selectedFolder ? f.folder === selectedFolder : true;
      return matchSearch && matchFolder;
    });
  }, [allFiles, fileQuery, selectedFolder]);

  const startEditing = (id: string, name: string) => {
    setEditingDocId(id);
    setEditingDocName(name);
    setValidationError(false);
  };

  const handleSaveRename = (id: string) => {
    if (!editingDocName.trim()) {
      setValidationError(true);
      toast.error("File name cannot be empty");
      return;
    }
    renameDocument(id, editingDocName.trim());
    setEditingDocId(null);
    setEditingDocName("");
    toast.success("File renamed successfully");
  };

  const handleCancelRename = () => {
    setEditingDocId(null);
    setEditingDocName("");
    setValidationError(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Folder sidebar */}
      <div className="panel p-4 lg:col-span-1 bg-card border-border/60 h-fit">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Directories</div>
        <div className="space-y-1 text-sm">
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors cursor-pointer",
              selectedFolder === null ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center gap-2"><FolderOpen className="h-4 w-4" /> All Files</span>
            <span>{allFiles.length}</span>
          </button>
          
          {folders.map((f) => {
            const isSelected = selectedFolder === f;
            const count = allFiles.filter((x) => x.folder === f).length;
            const isExternal = projectStorageMappings.some((m) => m.folderName === f);
            if (isExternal) return null;

            return (
              <div
                key={f}
                className={cn(
                  "group/folder relative flex items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors cursor-pointer text-sm pr-18",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSelectedFolder(f)}
              >
                <span className="inline-flex items-center gap-2 truncate max-w-[60%]">
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">{f}</span>
                </span>
                
                <span className="text-xs text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2">{count}</span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    open("doc.folder.rename", { projectId, folder: f });
                  }}
                  className="absolute right-13 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 p-0.5 hover:bg-muted-foreground/10 rounded text-muted-foreground hover:text-foreground cursor-pointer transition-opacity"
                  title="Rename folder"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    open("doc.folder.delete", { projectId, folder: f });
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 p-0.5 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-600 cursor-pointer transition-opacity"
                  title="Delete folder"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Connected Storage */}
        <div className="mt-6 border-t border-border/40 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Connected Storage</span>
            <button
              onClick={() => open("project.storage.connect", { projectId })}
              className="rounded-full border border-border/50 bg-background/30 px-2.5 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              + Connect
            </button>
          </div>
          
          {projectStorageMappings.length === 0 ? (
            <div className="text-xs text-muted-foreground/70 bg-muted/15 rounded-2xl p-4 border border-dashed border-border/70 leading-relaxed text-center font-medium">
              No cloud directories connected. Connect Google Drive, Dropbox, or OneDrive to sync assets.
            </div>
          ) : (
            <div className="space-y-2">
              {projectStorageMappings.map((mapping) => {
                const providerMeta = {
                  gdrive: {
                    name: "Google Drive",
                    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                    icon: Cloud
                  },
                  dropbox: {
                    name: "Dropbox",
                    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
                    icon: FolderOpen
                  },
                  box: {
                    name: "Box.com",
                    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
                    icon: HardDrive
                  },
                  onedrive: {
                    name: "OneDrive",
                    color: "text-blue-600 bg-blue-600/10 border-blue-600/20",
                    icon: Cloud
                  }
                }[mapping.provider] || {
                  name: mapping.provider,
                  color: "text-muted-foreground bg-muted border-border",
                  icon: Cloud
                };

                const isSelected = selectedFolder === mapping.folderName;

                return (
                  <div
                    key={mapping.id}
                    className={cn(
                      "group/mapping relative flex items-center gap-3 rounded-2xl border p-3 transition-all cursor-pointer text-xs",
                      isSelected
                        ? "border-primary/45 bg-primary/[0.03] text-primary"
                        : "border-border/50 bg-card hover:bg-muted/40 hover:border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setSelectedFolder(mapping.folderName)}
                  >
                    {/* Brand Icon Wrapper */}
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-300",
                      providerMeta.color
                    )}>
                      <providerMeta.icon className="h-4.5 w-4.5" />
                    </div>

                    {/* Meta Details */}
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="font-semibold text-foreground truncate leading-tight">
                        {mapping.folderName}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 truncate mt-0.5 font-medium leading-none">
                        {providerMeta.name} · {mapping.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground/75 leading-none">
                        <span className="inline-block h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                      </div>
                    </div>

                    {/* Disconnect Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unmapProjectStorage(mapping.id);
                        if (isSelected) setSelectedFolder(null);
                        toast.info("External directory disconnected");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/mapping:opacity-100 p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                      aria-label="Disconnect storage"
                      title="Disconnect storage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:col-span-3 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/40">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
                placeholder="Search files..."
                className="h-9 w-48 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            
            <div className="flex border border-border rounded-full p-0.5 bg-card">
              <button
                onClick={() => setViewType("grid")}
                className={cn("rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer", viewType === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                Grid
              </button>
              <button
                onClick={() => setViewType("list")}
                className={cn("rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer", viewType === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                List
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => open("doc.folder.new", { projectId })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5" /> New folder
            </button>
            <button
              onClick={() => open("doc.upload", { projectId })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" /> Upload file
            </button>
          </div>
        </div>

        {/* Files Grid / List */}
        {filteredFiles.length === 0 ? (
          <div className="panel p-12 text-center text-muted-foreground bg-card/50">
            No files available in this directory. Click 'Upload file' to manually add assets.
          </div>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="panel overflow-hidden bg-card border-border/60 flex flex-col justify-between group">
                <div className="h-28 bg-muted/40 flex items-center justify-center relative select-none overflow-hidden">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    getFileIcon(file.name, "h-10 w-10")
                  )}
                  <span className="absolute top-2 right-2 text-[9px] font-semibold bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">{file.folder}</span>
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
                        onDoubleClick={() => startEditing(file.id, file.name)}
                        className="text-xs font-bold text-foreground truncate cursor-pointer"
                        title="Double-click to rename"
                      >
                        {file.name}
                      </h4>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{file.size} · {file.uploadedAt}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                    <button
                      onClick={() => {
                        toggleDocumentShared(file.id);
                        toast.success(`Visibility updated for ${file.name}`, {
                          description: !file.shared ? "Changed to Client Shared" : "Changed to Internal Only"
                        });
                      }}
                      className="inline-flex items-center gap-1 text-[10px] hover:bg-muted/80 px-2 py-0.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-border/60"
                      title="Click to toggle visibility"
                    >
                      {file.shared ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold"><Eye className="h-3 w-3" /> Client Shared</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Lock className="h-3 w-3" /> Internal Only</span>
                      )}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          toast.success("Download started", { description: file.name });
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEditing(file.id, file.name)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => open("doc.move", { documentId: file.id })}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                        title="Move folder"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
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
            ))}
          </div>
        ) : (
          <div className="panel bg-card border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground bg-muted/20">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Directory</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded By</th>
                  <th className="px-4 py-3 font-medium">Visibility</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const u = users.find((x) => x.id === file.uploadedBy);
                  return (
                    <tr key={file.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-xs">
                        {editingDocId === file.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={editingDocName}
                              onChange={(e) => setEditingDocName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveRename(file.id)}
                              className={cn(
                                "px-2 py-1 text-xs border rounded-xl bg-background outline-none",
                                validationError ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:ring-1 focus:ring-primary"
                              )}
                              autoFocus
                            />
                            <button onClick={() => handleSaveRename(file.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
                              <Check className="h-3 w-3" />
                            </button>
                            <button onClick={handleCancelRename} className="p-1 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onDoubleClick={() => startEditing(file.id, file.name)}
                            className="inline-flex items-center gap-2 cursor-pointer"
                            title="Double-click to rename"
                          >
                            {getFileIcon(file.name, "h-3.5 w-3.5")}
                            {file.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{file.folder}</td>
                      <td className="px-4 py-3 text-muted-foreground">{file.size}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u ? u.name.split(" ")[0] : "System"} · {file.uploadedAt}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            toggleDocumentShared(file.id);
                            toast.success(`Visibility updated for ${file.name}`, {
                              description: !file.shared ? "Changed to Client Shared" : "Changed to Internal Only"
                            });
                          }}
                          className="inline-flex items-center gap-1 text-xs hover:bg-muted/80 px-2 py-0.5 rounded-full transition-all cursor-pointer border border-transparent hover:border-border/60"
                          title="Click to toggle visibility"
                        >
                          {file.shared ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><Eye className="h-3 w-3" /> Client</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> Internal</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              toast.success("Download started", { description: file.name });
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => startEditing(file.id, file.name)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => open("doc.move", { documentId: file.id })}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            title="Move folder"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => open("doc.delete", { documentId: file.id })}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Two-Column Chat System Tab ───── */

function ChatTab({ projectId, onOpenTask }: { projectId: string; onOpenTask: (id: string) => void }) {
  const [activeThreadId, setActiveThreadId] = useState<string>(projectId);
  const [chatSearch, setChatSearch] = useState("");
  
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const comments = useStore((s) => s.comments);
  const createComment = useStore((s) => s.createComment);
  const users = useStore((s) => s.users);
  
  // File Upload states for chat attachments
  const uploadDocument = useStore((s) => s.uploadDocument);
  const [uploadAttachOpen, setUploadAttachOpen] = useState(false);
  const [attachFileName, setAttachFileName] = useState("");
  const [attachFileIsInternal, setAttachFileIsInternal] = useState(false);

  const activeComments = useMemo(() => {
    return comments.filter((c) => c.threadId === activeThreadId);
  }, [comments, activeThreadId]);

  const activeTitle = useMemo(() => {
    if (activeThreadId === projectId) {
      return "Project General Chat";
    }
    const t = tasks.find((task) => task.id === activeThreadId);
    return t ? `Task: ${t.title}` : "Discussion Thread";
  }, [activeThreadId, tasks, projectId]);

  const taskThreads = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(chatSearch.toLowerCase());
      const hasComments = comments.some((c) => c.threadId === t.id);
      return matchSearch && hasComments;
    });
  }, [tasks, chatSearch, comments]);

  const handleSendAttach = () => {
    if (!attachFileName.trim()) return;

    // 1. Create document
    const size = `${(Math.random() * 3 + 0.5).toFixed(1)} MB`;
    const doc = uploadDocument({
      projectId,
      name: attachFileName.trim(),
      folder: "Attachments",
      size,
      shared: !attachFileIsInternal,
    });

    // 2. Post comment with link
    createComment({
      threadId: activeThreadId,
      author: "u1",
      body: `Attached file: ${doc.name} (${doc.size})`,
      visibility: attachFileIsInternal ? "internal" : "client",
      attachments: [doc.id],
    });

    setAttachFileName("");
    setUploadAttachOpen(false);
    toast.success(`File ${doc.name} attached to conversation`);
  };

  return (
    <div className="panel overflow-hidden bg-card border-border/60 grid grid-cols-1 md:grid-cols-3 min-h-[520px]">
      {/* Left Sidebar */}
      <div className="border-r border-border md:col-span-1 flex flex-col h-full bg-muted/10">
        <div className="p-4 border-b border-border flex flex-col gap-3 bg-card/60">
          <h3 className="text-sm font-bold text-foreground tracking-tight select-none">Discussions</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="h-8 w-full rounded-full border border-border bg-card pl-8 pr-3 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[605px] scrollbar-thin">
          <button
            onClick={() => setActiveThreadId(projectId)}
            className={cn( "flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer", activeThreadId === projectId ? "bg-primary text-primary-foreground " : "hover:bg-muted text-muted-foreground hover:text-foreground" )}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1 truncate">
              <div>Project General Chat</div>
              <div className="text-[10px] opacity-75 font-normal truncate">General discussion, briefs & feedback</div>
            </div>
            {comments.filter(c => c.threadId === projectId).length > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeThreadId === projectId ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20 text-foreground")}>
                {comments.filter(c => c.threadId === projectId).length}
              </span>
            )}
          </button>

          <div className="my-2 border-t border-border/50 mx-2" />
          <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">Task Threads</div>

          {taskThreads.map((t) => {
            const taskComments = comments.filter((c) => c.threadId === t.id);
            return (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={cn( "flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer", activeThreadId === t.id ? "bg-primary text-primary-foreground " : "hover:bg-muted text-muted-foreground hover:text-foreground" )}
              >
                <ListTodo className="h-4 w-4 shrink-0" />
                <div className="flex-1 truncate">
                  <div className="truncate">{t.title}</div>
                  <div className="text-[10px] opacity-75 font-normal truncate">Stage: {STAGE_META[t.stage].label}</div>
                </div>
                {taskComments.length > 0 && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeThreadId === t.id ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20 text-foreground")}>
                    {taskComments.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right conversation view */}
      <div className="md:col-span-2 flex flex-col justify-between h-full bg-card">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-muted/5">
          <div>
            <div className="text-sm font-bold text-foreground">{activeTitle}</div>
            <div className="text-xs text-muted-foreground leading-normal mt-0.5">Unified thread log · updates synced automatically</div>
          </div>
          {activeThreadId !== projectId && (() => {
            const task = tasks.find(t => t.id === activeThreadId);
            const meta = STAGE_META[task?.stage || "todo"];
            return (
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/10", meta.tone, meta.pill)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenTask(activeThreadId)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View Task
                </button>
              </div>
            );
          })()}
        </div>

        {/* Message Log */}
        <div className="flex-1 max-h-[360px] overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activeComments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/45" />
              <p className="text-sm font-medium">No messages posted in this thread yet.</p>
              <p className="text-xs text-muted-foreground/75 mt-0.5">Use the comment box below to update the client or team.</p>
            </div>
          ) : (
            activeComments.map((m) => {
              const u = users.find((x) => x.id === m.author);
              const internal = m.visibility === "internal";
              if (!u) return null;
              return (
                <div key={m.id} className="flex gap-3 text-sm">
                  <UserAvatar user={u} size={32} />
                  <div className={cn("flex-1 rounded-2xl px-4 py-3 border border-border/40 transition-all hover:border-border/85", internal ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/40")}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-muted-foreground">{m.createdAt}</span>
                      {internal && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/45 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                          <Lock className="h-2.5 w-2.5" /> Internal only
                        </span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90">
                      <FormattedBody html={m.body} />
                      <CommentAttachmentsList attachmentIds={m.attachments} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <div className="border-t border-border p-4 bg-muted/5">
          <ChatInputBox threadId={activeThreadId} onAttachClick={() => setUploadAttachOpen(true)} />
        </div>
      </div>

      {/* Attachment Upload Dialog */}
      <AppDialog
        open={uploadAttachOpen}
        onOpenChange={setUploadAttachOpen}
        title="Attach file to thread"
        description="Select and mock upload a document file to attach in this active discussion."
        icon={<Paperclip className="h-5 w-5" />}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              onClick={() => setUploadAttachOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSendAttach}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Attach File
            </button>
          </div>
        }
      >
        <FieldGroup>
          <TextField
            label="File Name"
            placeholder="e.g. Asset-Sitemap-v1.pdf"
            value={attachFileName}
            onChange={(e) => setAttachFileName(e.target.value)}
            autoFocus
          />
          <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={attachFileIsInternal}
              onChange={(e) => setAttachFileIsInternal(e.target.checked)}
              className="h-4 w-4 accent-primary rounded"
            />
            <span>Mark file as Internal (hidden from clients)</span>
          </label>
        </FieldGroup>
      </AppDialog>
    </div>
  );
}

function ChatInputBox({ threadId, onAttachClick }: { threadId: string; onAttachClick: () => void }) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const projectId = useParams().projectId as string || "p1";

  const handleSubmit = () => {
    if (!commentText.trim() && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: !isInternal,
      });
      return doc.id;
    });

    createComment({
      threadId,
      author: "u1", // Owner: Carina Rivera
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
      attachments: docIds,
    });
    setCommentText("");
    setAttachments([]);
    toast.success("Comment posted");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0 || attachments.length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      placeholder="Type your message..."
      minHeight={100}
      onSend={handleSubmit}
      sendDisabled={!isEnabled}
      showInternalOnly
      isInternal={isInternal}
      onInternalChange={setIsInternal}
    />
  );
}


/* ───── Time Entries Tab ───── */

function TimeTab({ projectId, onTaskClick }: { projectId: string; onTaskClick?: (id: string) => void }) {
  const allTimeEntries = useStore((s) => s.timeEntries);
  const projectEntries = useMemo(() => allTimeEntries.filter((t) => t.projectId === projectId), [allTimeEntries, projectId]);
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const { open } = useModals();
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedBillable, setSelectedBillable] = useState("all");

  // Dynamic values
  const totalHours = useMemo(() => projectEntries.reduce((sum, e) => sum + e.hours, 0), [projectEntries]);
  const displayHours = useMemo(() => {
    if (selectedMember === "all") return totalHours;
    return projectEntries.filter((e) => e.userId === selectedMember).reduce((sum, e) => sum + e.hours, 0);
  }, [projectEntries, selectedMember, totalHours]);

  const selectedMemberName = useMemo(() => {
    if (selectedMember === "all") return "";
    const u = users.find((x) => x.id === selectedMember);
    return u ? u.name.split(" ")[0] : "";
  }, [selectedMember, users]);

  const billableHours = useMemo(() => projectEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0), [projectEntries]);
  const nonBillableHours = totalHours - billableHours;

  const filteredEntries = useMemo(() => {
    return projectEntries.filter((e) => {
      if (searchQuery && !e.note.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedMember !== "all" && e.userId !== selectedMember) return false;
      if (selectedBillable === "billable" && !e.billable) return false;
      if (selectedBillable === "non-billable" && e.billable) return false;
      return true;
    });
  }, [projectEntries, searchQuery, selectedMember, selectedBillable]);

  const teammateHours = useMemo(() => {
    const map: Record<string, number> = {};
    projectEntries.forEach((e) => {
      map[e.userId] = (map[e.userId] || 0) + e.hours;
    });
    return Object.entries(map)
      .map(([userId, hours]) => ({
        userId,
        hours,
        user: users.find((u) => u.id === userId),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [projectEntries, users]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Interactive Title & Action Bar */}
      <div className="col-span-full flex items-center justify-between pb-2">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Time Tracking
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track work hours, billing status, and monitor project budgets.</p>
        </div>
        <button
          onClick={() => open("time.log", { projectId })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/95 cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Log Time
        </button>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="all">All Teammates</option>
              {users.filter(u => u.role !== "client").map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <select
              value={selectedBillable}
              onChange={(e) => setSelectedBillable(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="all">All Billability</option>
              <option value="billable">Billable Only</option>
              <option value="non-billable">Non-billable Only</option>
            </select>
            {(searchQuery || selectedMember !== "all" || selectedBillable !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMember("all");
                  setSelectedBillable("all");
                }}
                className="text-xs font-semibold text-primary hover:bg-muted px-2.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table wrapper */}
        <div className="panel bg-card border-border/60 overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Search className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-foreground">No time entries found</div>
              <div className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
                Try adjusting your search queries or filter selections.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/20 border-b border-border/60">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Teammate</th>
                    <th className="px-4 py-3 font-semibold">Note / Work Done</th>
                    <th className="px-4 py-3 font-semibold text-right">Hours</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEntries.map((e) => {
                    const u = users.find((x) => x.id === e.userId)!;
                    if (!u) return null;
                    return (
                      <tr key={e.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{e.date}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <UserAvatar user={u} size={22} />
                            <span className="font-semibold text-foreground/90 text-xs whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-xs text-foreground/80 max-w-[220px] md:max-w-[320px] truncate" title={e.note}>
                            {e.note || <span className="italic text-muted-foreground/30">No note provided</span>}
                          </div>
                          {(() => {
                            const assocTask = e.taskId ? tasks.find((t) => t.id === e.taskId) : null;
                            if (!assocTask) return null;
                            return (
                              <button
                                onClick={() => onTaskClick?.(assocTask.id)}
                                className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-primary hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10 w-fit transition-all"
                              >
                                <span className="h-1.2 w-1.2 rounded-full bg-primary" />
                                Task: {assocTask.title}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs bg-muted text-foreground/80 font-mono">
                            {e.hours.toFixed(1)}h
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {e.billable ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" />
                              Billable
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-500/10">
                              <span className="h-1 w-1 rounded-full bg-slate-400" />
                              Non-billable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => open("time.edit", { timeId: e.id })}
                              className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                              title="Edit time log"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => open("time.delete", { timeId: e.id })}
                              className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                              title="Delete time log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Hours Logged Card */}
        <div className="panel p-5 bg-card border-border/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Hours Logged {selectedMemberName ? `(${selectedMemberName})` : ""}
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {displayHours.toFixed(1)}h
              </div>
            </div>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${Math.min(100, (displayHours / Math.max(1, project.hoursEstimate)) * 100)}%` }} 
            />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Estimate: {project.hoursEstimate}h</span>
            <span>{Math.round((displayHours / Math.max(1, project.hoursEstimate)) * 100)}%</span>
          </div>
        </div>

        {/* Budget Card */}
        <div className="panel p-5 bg-card border-border/60">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Budget</div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                ${(project.spent / 1000).toFixed(1)}k
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Coins className="h-4.5 w-4.5" />
            </div>
          </div>
          {(() => {
            const budgetPercent = Math.round((project.spent / Math.max(1, project.budget)) * 100);
            let barColor = "bg-emerald-500";
            if (budgetPercent > 90) barColor = "bg-rose-500";
            else if (budgetPercent > 70) barColor = "bg-amber-500";

            return (
              <>
                <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={cn("h-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.min(100, budgetPercent)}%` }} 
                  />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Budget: ${(project.budget / 1000).toFixed(0)}k</span>
                  <span>{budgetPercent}%</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Teammate Contribution Card */}
        <div className="panel p-5 bg-card border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Teammate Contribution</h3>
          <div className="space-y-3.5">
            {teammateHours.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-1">No hours logged yet</div>
            ) : (
              teammateHours.map(({ userId, hours, user }) => {
                if (!user) return null;
                const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0;
                return (
                  <div key={userId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={user} size={18} />
                        <span className="font-medium text-foreground">{user.name.split(" ")[0]}</span>
                      </div>
                      <span className="font-semibold text-muted-foreground">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/75 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Billability Breakdown Card */}
        <div className="panel p-5 bg-card border-border/60">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billability Breakdown</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">billable hours</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${totalHours > 0 ? (billableHours / totalHours) * 100 : 0}%` }}
              title={`Billable: ${billableHours}h`}
            />
            <div
              className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-500"
              style={{ width: `${totalHours > 0 ? (nonBillableHours / totalHours) * 100 : 0}%` }}
              title={`Non-billable: ${nonBillableHours}h`}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Billable: <strong>{billableHours.toFixed(1)}h</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>Non-billable: <strong>{nonBillableHours.toFixed(1)}h</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center bg-card border-border/60">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">Use the buttons above to get started.</div>
    </div>
  );
}

export default ProjectDetail;
