"use client";

import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import { useStore, useProjects, type StorageConnection } from "@/lib/store";
import { useModals } from "@/components/modals";
import { DateInput } from "@/components/ui/date-input";
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
  Folder,
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
import { FilterBar, inRange, type FilterOption, type FilterDef } from "@/components/filter-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AppDialog, TextField, SelectField, FieldGroup, FieldLabel } from "@/components/ui/app-dialog";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { celebrateFromElement } from "@/lib/confetti";
import { RequestDetailsDrawer } from "../../requests/page";
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
  { id: "files", label: "Files", icon: Folder },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

const formatSubmissionTime = (submittedAt: string) => {
  if (!submittedAt) return "";
  const isRecent = 
    submittedAt.toLowerCase().includes("hour") ||
    submittedAt.toLowerCase().includes("min") ||
    submittedAt.toLowerCase().includes("now") ||
    submittedAt.toLowerCase().includes("today");
    
  if (isRecent) {
    return `Submitted ${submittedAt}`;
  }
  
  let dateVal = new Date();
  if (submittedAt.toLowerCase() === "yesterday" || submittedAt.toLowerCase() === "1 day ago") {
    dateVal.setDate(dateVal.getDate() - 1);
  } else if (submittedAt.toLowerCase().includes("days ago")) {
    const num = parseInt(submittedAt);
    if (!isNaN(num)) {
      dateVal.setDate(dateVal.getDate() - num);
    }
  } else {
    const parsed = new Date(submittedAt);
    if (!isNaN(parsed.getTime())) {
      dateVal = parsed;
    }
  }
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateFormatted = `${months[dateVal.getMonth()]} ${dateVal.getDate()}, ${dateVal.getFullYear()}`;
  
  const hours24 = dateVal.getHours();
  const ampm = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  const mins = String(dateVal.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours12}:${mins}${ampm}`;
  
  return `Submitted on ${dateFormatted} at ${timeFormatted}`;
};

function ProjectDetail() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const router = useRouter();
  const { open } = useModals();
  
  const projects = useProjects();
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const allRequests = useStore((s) => s.requests);
  const channels = useStore((s) => s.channels);

  const projectRequestsCount = useMemo(() => {
    return allRequests.filter(
      (r) =>
        r.projectId === projectId &&
        (r.status === "submitted" || r.status === "under_review")
    ).length;
  }, [allRequests, projectId]);

  const hasUnreadChat = useMemo(() => {
    return channels.some((c) => c.projectId === projectId && c.unread > 0);
  }, [channels, projectId]);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => project ? clients.find((c) => c.id === project.clientId) : undefined, [clients, project]);
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId;
  const [tab, setTab] = useState<TabId>(() => tabParam || "tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) {
      setTab(tabParam);
    }
  }, [tabParam]);

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
              "grid h-14 w-14 place-items-center rounded-full text-2xl font-bold border transition-all duration-300",
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
              onClick={() => open("project.edit", { projectId: project.id })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
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
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {tab === "overview" && <Overview projectId={project.id} />}
        {tab === "tasks" && <TasksTab projectId={project.id} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} />}
        {tab === "requests" && <RequestsTab projectId={project.id} onSelectRequest={setSelectedRequestId} />}
        {tab === "files" && <DocumentsTab projectId={project.id} />}
        {tab === "chat" && <ChatTab projectId={project.id} onOpenTask={setSelectedTaskId} />}
        {tab === "time" && <TimeTab projectId={project.id} onTaskClick={setSelectedTaskId} />}
      </div>

      {/* Hoisted Task Details Drawer */}
      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} hideDiscussion={tab === "chat"} />
      
      {/* Hoisted Request Details Drawer */}
      <RequestDetailsDrawer requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />
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
  const projects = useProjects();
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const t = useMemo(() => allTasks.filter((x) => x.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);

  const client = useMemo(() => clients.find((c) => c.id === project.clientId), [clients, project.clientId]);
  const clientUser = useMemo(() => {
    if (!client) return undefined;
    // Prefer a linked user record if one exists (keeps avatar/identity consistent
    // across the app), but always fall back to the client's own contact info so
    // the Team panel reflects whichever client is currently assigned — even for
    // clients that don't have a matching entry in the users list.
    const linked = users.find((u) => u.role === "client" && (u.email === client.contactEmail || u.name === client.contact));
    if (linked) return linked;
    const initials = client.contact.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
    return {
      id: `client-contact-${client.id}`,
      name: client.contact,
      email: client.contactEmail,
      role: "client" as const,
      title: client.contactRole || client.name,
      avatar: initials,
      color: client.logoColor,
    };
  }, [users, client]);

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
            value={{ fixed: "Fixed", hourly: "Hourly", retainer: "Retainer" }[project.type] ?? project.type}
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
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium">{project.endDate}</span>
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-9 w-48 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>


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
              <button
                onClick={() => {
                  setNewTaskStage(stage);
                  setNewTaskOpen(true);
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
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

function parseSizeToBytes(size: string): number {
  const match = size.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!match) return 1024;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "KB") return num * 1024;
  if (unit === "MB") return num * 1024 * 1024;
  if (unit === "GB") return num * 1024 * 1024 * 1024;
  return num;
}

function guessMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  }
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}

export function TaskDetailsDrawer({
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
  const projects = useProjects();
  const project = useMemo(() => projects.find((p) => p.id === task?.projectId), [projects, task?.projectId]);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === taskId), [allComments, taskId]);
  const documents = useStore((s) => s.documents);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [taskId]);

  const creatorUser = useMemo(() => {
    if (!task) return null;
    const taskObj = task as any;
    if (taskObj.createdBy) {
      return users.find((u) => u.id === taskObj.createdBy);
    }
    if (project?.lead) {
      return users.find((u) => u.id === project.lead);
    }
    return users.find((u) => u.id === "u1");
  }, [task, project, users]);

  const taskDocuments = useMemo(() => {
    if (!task) return [];
    const commentDocIds = comments.reduce((acc, c) => [...acc, ...(c.attachments ?? [])], [] as string[]);
    const directDocIds = task.attachmentDocIds ?? [];
    const realDocIds = Array.from(new Set([...directDocIds, ...commentDocIds]));
    const fromStore = documents.filter((d) => realDocIds.includes(d.id));
    if (fromStore.length > 0) return fromStore;

    const mockFiles: Document[] = [];
    const count = task.attachments ?? 0;
    for (let i = 0; i < count; i++) {
      mockFiles.push({
        id: `mock-doc-${task.id}-${i}`,
        projectId: task.projectId,
        name: i === 0 ? `${task.title.replace(/[\s/\\?%*:|"<>]+/g, "-")}-Mockup.fig` : `Reference-Resource-${i}.pdf`,
        folder: "Design",
        size: i === 0 ? "4.2 MB" : "1.8 MB",
        uploadedBy: "u2",
        uploadedAt: "3 days ago",
        shared: true,
      });
    }
    return mockFiles;
  }, [task, comments, documents]);

  const handleRemoveAttachment = (doc: Document) => {
    if (!task) return;

    const isSyntheticMock = doc.id.startsWith(`mock-doc-${task.id}-`);

    if (isSyntheticMock) {
      // These placeholder attachments are re-derived purely from task.attachments
      // (a count) every render — they have no stable id beyond their position in
      // that loop. Removing one by just decrementing the count reshuffles the
      // remaining slots, so it can look like the wrong file got removed.
      // Fix: materialize the ones that should survive into real documents with
      // stable ids, so future removals target the exact file clicked.
      const remaining = taskDocuments.filter((d) => d.id !== doc.id);
      const materializedIds = remaining.map(
        (d) =>
          uploadDocument({
            projectId: task.projectId,
            name: d.name,
            folder: d.folder,
            size: d.size,
            uploadedBy: d.uploadedBy,
            shared: d.shared,
          }).id,
      );
      updateTask(task.id, { attachmentDocIds: materializedIds, attachments: materializedIds.length });
      toast.success(`Removed ${doc.name}`);
      return;
    }

    // Real documents live in the global documents store.
    if (documents.some((d) => d.id === doc.id)) {
      deleteDocument(doc.id);
    }
    const nextIds = (task.attachmentDocIds ?? []).filter((id) => id !== doc.id);
    updateTask(task.id, {
      attachmentDocIds: nextIds,
      attachments: Math.max(0, (task.attachments ?? 0) - 1),
    });
    toast.success(`Removed ${doc.name}`);
  };

  const descriptionAttachments = useMemo<RichAttachment[]>(() => {
    if (!task) return [];
    const ids = task.attachmentDocIds ?? [];
    return documents
      .filter((d) => ids.includes(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        size: parseSizeToBytes(d.size),
        type: guessMimeType(d.name),
        url: d.previewUrl || "#",
      }));
  }, [task, documents]);

  const handleDescriptionAttachmentsChange = (next: RichAttachment[]) => {
    if (!task) return;
    // Only files that resolved to a real Document (e.g. picked via "Attach
    // from Files", or uploaded to a connected storage folder) get persisted
    // into the task's Attachments section below — local-only blob previews
    // stay in the description editor's own tray.
    const ids = next.filter((a) => documents.some((d) => d.id === a.id)).map((a) => a.id);
    updateTask(task.id, { attachmentDocIds: ids, attachments: ids.length });
  };

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
          {project && (
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2 mb-1 px-0">
              {project.name}
            </div>
          )}
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-0 p-0 m-0 text-foreground"
          />
          {task.createdAt && (
            <div className="text-xs text-muted-foreground mt-1.5 px-0">
              Created on{" "}
              {new Date(task.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              by {creatorUser?.name || "Carina Rivera"}
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
            <DateInput
              size="sm"
              value={parseDateToInputVal(task.dueDate)}
              onChange={(e) => updateTask(task.id, { dueDate: formatToMockDate(e.target.value) })}
              className="col-span-2 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Start Date:</span>
            <DateInput
              size="sm"
              value={task.startDate ?? ""}
              onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
              className="col-span-2"
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
                {parseFloat(taskHours.toFixed(2))}h
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
            projectId={task.projectId}
            attachments={descriptionAttachments}
            onAttachmentsChange={handleDescriptionAttachmentsChange}
            showAttachmentsList={false}
          />
        </div>

        {/* Attachments Section */}
        {taskDocuments.length > 0 && (
          <div className="border-t border-border/80 pt-6 mt-6 mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Attachments</span>
              <span className="text-xs text-muted-foreground font-normal capitalize tracking-normal">
                {taskDocuments.length} {taskDocuments.length === 1 ? "file" : "files"}
              </span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {taskDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-2.5 rounded-xl transition-all group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                      {doc.name.split(".").pop()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate" title={doc.name}>
                        {doc.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {doc.size}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.success(`Downloading ${doc.name}...`);
                      }}
                      className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(doc)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-md text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Time Tracker Section */}
        <div className="border-t border-border/80 pt-6 mt-6 mb-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Task Time Tracker</span>
            <span className="text-xs text-muted-foreground font-normal capitalize tracking-normal">
              {taskEntries.length} {taskEntries.length === 1 ? "log" : "logs"}
            </span>
          </h4>

          {/* Form to log time inline */}
          <div className="bg-card/40 p-2.5 rounded-2xl border border-border/40 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="0.00h"
                value={logHours === 0 ? "" : logHours}
                onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                className="h-9 w-20 rounded-full border border-border bg-card text-center text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <input
                type="text"
                placeholder="What did you work on?"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                className="h-9 flex-1 min-w-[150px] rounded-full border border-border bg-card px-3.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setLogBillable(!logBillable)}
                className={cn(
                  "h-9 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none",
                  logBillable
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Billable
              </button>
              <button
                onClick={handleLogTime}
                disabled={logHours <= 0}
                className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> Log
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
              <span className="text-xs text-muted-foreground font-normal capitalize tracking-normal">{comments.length} comments</span>
            </h4>
            <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin" style={{ margin: 0, paddingBottom: 20 }}>
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

        {/* Footer */}
        <div className="border-t border-border/80 pt-4 mt-8 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirmDelete) {
                deleteTask(task.id);
                toast.success("Task deleted successfully");
                onClose();
              } else {
                setConfirmDelete(true);
              }
            }}
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            {confirmDelete ? "Confirm Delete" : "Delete Task"}
          </button>

        </div>
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

function RequestsTab({ projectId, onSelectRequest }: { projectId: string; onSelectRequest: (id: string) => void }) {
  const allRequests = useStore((s) => s.requests);
  const users = useStore((s) => s.users);
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
          closed: {
            cardHover: "hover:border-rose-500/25",
            glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
            badge: "bg-todo text-todo-foreground border-todo-foreground/20",
            textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
          },
          convert: {
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
                    onClick={() => onSelectRequest(r.id)}
                    className="text-left block w-full group/title cursor-pointer"
                  >
                    <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2 decoration-1", accentCls.textHover)}>
                      {r.title}
                    </h3>
                  </button>
                </div>
              </div>

              {/* Status & Priority Row */}
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectRequest(r.id)}
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
                  <span>{formatSubmissionTime(r.submittedAt)}</span>
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
                  onClick={() => onSelectRequest(r.id)}
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

  // Selections & Bulk Actions
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  useEffect(() => {
    setSelectedFileIds([]);
  }, [fileQuery, selectedFolder]);

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

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
    <div className="space-y-4">
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
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", viewType === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Grid
            </button>
            <button
              onClick={() => setViewType("list")}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", viewType === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              List
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedFileIds.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedFileIds.length} selected files?`)) {
                  selectedFileIds.forEach(id => deleteDocument(id));
                  setSelectedFileIds([]);
                  toast.success("Selected files deleted successfully");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-semibold text-rose-50 hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedFileIds.length})
            </button>
          )}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "panel overflow-hidden bg-card flex flex-col justify-between group relative transition-all",
                  selectedFileIds.includes(file.id) ? "border-primary/50 ring-1 ring-primary/20 bg-primary/[0.01]" : "border-border/60"
                )}
              >
                {/* Checkbox wrapper */}
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
                  <th className="px-4 py-3 w-10 text-center">
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
                    <tr
                      key={file.id}
                      className={cn(
                        "border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors",
                        selectedFileIds.includes(file.id) && "bg-primary/[0.01]"
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onChange={() => toggleSelectFile(file.id)}
                          className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
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
  );
}

/* ───── Two-Column Chat System Tab ───── */

function ChatTab({ projectId, onOpenTask }: { projectId: string; onOpenTask: (id: string) => void }) {
  const [activeThreadId, setActiveThreadId] = useState<string>(projectId);
  const [chatSearch, setChatSearch] = useState("");
  
  const projects = useProjects();
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const comments = useStore((s) => s.comments);
  const createComment = useStore((s) => s.createComment);
  const users = useStore((s) => s.users);

  const messageLogRef = useRef<HTMLDivElement>(null);

  const activeComments = useMemo(() => {
    return comments.filter((c) => c.threadId === activeThreadId);
  }, [comments, activeThreadId]);

  useEffect(() => {
    if (messageLogRef.current) {
      messageLogRef.current.scrollTop = messageLogRef.current.scrollHeight;
    }
  }, [activeThreadId, activeComments]);
  
  // File Upload states for chat attachments
  const uploadDocument = useStore((s) => s.uploadDocument);
  const [uploadAttachOpen, setUploadAttachOpen] = useState(false);
  const [attachFileName, setAttachFileName] = useState("");
  const [attachFileIsInternal, setAttachFileIsInternal] = useState(false);


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
          <h3 className="text-sm font-bold text-foreground tracking-tight select-none">Conversations</h3>
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
        <div ref={messageLogRef} className="flex-1 max-h-[360px] overflow-y-auto p-6 space-y-4 scrollbar-thin">
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

function TimeTab({ projectId, onTaskClick }: { projectId: string; onTaskClick?: (id: string) => void }) {
  const allTimeEntries = useStore((s) => s.timeEntries);
  const projectEntries = useMemo(() => allTimeEntries.filter((t) => t.projectId === projectId), [allTimeEntries, projectId]);
  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const { open } = useModals();
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(
    () => {
      const defs: FilterDef[] = [
        {
          id: "member",
          label: "Team",
          multi: true,
          options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })),
        },
        {
          id: "billable",
          label: "Billable",
          options: [
            { value: "yes", label: "Billable" },
            { value: "no", label: "Non-billable" },
          ] as FilterOption[],
        },
      ];
      return defs;
    },
    [users]
  );

  const filteredEntries = useMemo(() => {
    return projectEntries.filter((e) => {
      if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.member?.length && !filters.member.includes(e.userId)) return false;
      if (filters.billable?.length) {
        const v = filters.billable[0];
        if (v === "yes" && !e.billable) return false;
        if (v === "no" && e.billable) return false;
      }
      if (!inRange(e.date, dateRange)) return false;
      return true;
    });
  }, [projectEntries, search, filters.member, filters.billable, dateRange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/40 [&>div]:mb-0 [&>div]:w-full [&_input]:h-9 [&_input]:w-48 [&_input]:text-xs [&_input]:pl-9 [&_input]:pr-3">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search notes…"
          filters={filterDefs}
          values={filters}
          onChange={setFilters}
          dateRange={dateRange}
          onDateRange={setDateRange}
          trailing={
            <button
              onClick={() => open("time.log", { projectId })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Log time
            </button>
          }
        />
      </div>

      {/* Table Section */}
      <div className="panel bg-card border-border/60 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <Search className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-foreground">No time entries found</div>
            <div className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
              Try adjusting your search query, dates, or filter selections.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground bg-muted/20">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Note / Work Done</th>
                  <th className="px-5 py-3 font-medium text-right">Hours</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => {
                  const u = users.find((x) => x.id === e.userId)!;
                  const p = projects.find((x) => x.id === e.projectId);
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground font-medium whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={u} size={24} />
                          <span className="text-foreground font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p ? (
                          <Link href={`/owner/projects/${p.id}`} className="hover:text-primary transition-colors font-medium">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground/50">General</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground font-medium">
                        <div>
                          {e.note || <span className="italic text-muted-foreground/30 font-normal">No note provided</span>}
                        </div>
                        {(() => {
                          const assocTask = e.taskId ? tasks.find((t) => t.id === e.taskId) : null;
                          if (!assocTask) return null;
                          return (
                            <button
                              onClick={() => onTaskClick?.(assocTask.id)}
                              className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-primary cursor-pointer bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10 w-fit transition-all"
                            >
                              <span className="h-1.2 w-1.2 rounded-full bg-primary" />
                              Task: {assocTask.title}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground font-semibold">
                        {parseFloat(e.hours.toFixed(2))}h
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          e.billable 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" 
                            : "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/10"
                        )}>
                          {e.billable ? "Billable" : "Non-billable"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 border border-border bg-card">
                            <DropdownMenuItem
                              onSelect={(ev) => {
                                ev.preventDefault();
                                setTimeout(() => open("time.edit", { timeId: e.id }), 100);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(ev) => {
                                ev.preventDefault();
                                setTimeout(() => deleteTimeEntry(e.id), 100);
                              }}
                              className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                            >
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
