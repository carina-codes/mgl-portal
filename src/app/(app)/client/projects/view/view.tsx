"use client";

import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange, type FilterDef, type FilterOption } from "@/components/filter-bar";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import { cn, stripHtml } from "@/lib/utils";
import { toast } from "sonner";
import {
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  REQUEST_TYPE_META,
  type TaskStage,
  type Task,
  type Document,
  type User,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  Search,
  Paperclip,
  MessageCircle,
  MessageSquare,
  Download,
  FileText,
  Inbox,
  HelpCircle,
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
  Clock,
  LayoutDashboard,
  ListTodo,
  Folder,
  Eye,
  TrendingUp,
  Coins,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FilePreviewDialog, isPreviewableFile } from "@/components/file-preview-dialog";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Files", icon: Folder },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TYPE_ICONS: Record<string, any> = {
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
};

/** Chronological sort key for a task's due date — tasks without a valid due
 * date sort to the end so date-ordered views stay top-to-bottom by urgency. */
const dueDateSortValue = (dateStr?: string) => {
  if (!dateStr) return Infinity;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? Infinity : parsed.getTime();
};

const formatSubmissionTime = (submittedAt: string) => {
  if (!submittedAt) return "";
  const isRecent =
    submittedAt.toLowerCase().includes("hour") ||
    submittedAt.toLowerCase().includes("min") ||
    submittedAt.toLowerCase().includes("now") ||
    submittedAt.toLowerCase().includes("today");
  if (isRecent) return `Submitted ${submittedAt}`;
  let dateVal = new Date();
  if (submittedAt.toLowerCase() === "yesterday" || submittedAt.toLowerCase() === "1 day ago") {
    dateVal.setDate(dateVal.getDate() - 1);
  } else if (submittedAt.toLowerCase().includes("days ago")) {
    const num = parseInt(submittedAt);
    if (!isNaN(num)) dateVal.setDate(dateVal.getDate() - num);
  } else {
    const parsed = new Date(submittedAt);
    if (!isNaN(parsed.getTime())) dateVal = parsed;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateFormatted = `${months[dateVal.getMonth()]} ${dateVal.getDate()}, ${dateVal.getFullYear()}`;
  const hours24 = dateVal.getHours();
  const ampm = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  const mins = String(dateVal.getMinutes()).padStart(2, "0");
  return `Submitted on ${dateFormatted} at ${hours12}:${mins}${ampm}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** Trigger a real download when the document has a working file URL behind
 * it; otherwise fall back to a simulated toast (most seed documents in this
 * prototype don't have real files backing them yet). */
function downloadDocument(doc: Document) {
  if (doc.previewUrl) {
    const link = window.document.createElement("a");
    link.href = doc.previewUrl;
    link.download = doc.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  } else {
    toast.success(`Downloading ${doc.name}...`);
  }
}

function useClientAsUser(client: ReturnType<typeof useActiveClient>["client"]) {
  return useMemo(
    () => ({
      id: `client-${client.id}`,
      name: client.contact,
      email: client.contactEmail,
      role: "client" as const,
      title: client.contactRole || client.name,
      avatar: client.contactAvatar || client.contact.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2),
      color: client.logoColor,
    }),
    [client],
  );
}

function PortalProjectDetail() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") as string;
  const { client } = useActiveClient();
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const users = useStore((s) => s.users);
  const allTasks = useStore((s) => s.tasks);
  // Header avatars show everyone actively contributing — management plus
  // anyone assigned to a task on this project — not just the Management list.
  const projectMemberIds = useMemo(() => {
    if (!project) return [];
    const taskAssignees = allTasks.filter((t) => t.projectId === project.id).flatMap((t) => t.assignees);
    return Array.from(new Set([...project.team, ...taskAssignees]));
  }, [project, allTasks]);

  const [tab, setTab] = useState<TabId>("overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  if (!project || project.clientId !== client.id) throw notFound();

  return (
    <AppShell role="client">
      <Link href="/client/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                Timeline: <span className="font-medium text-foreground">{project.startDate} – {project.endDate}</span>
                <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[project.status].cls}`}>
                  {PROJECT_STATUS_META[project.status].label}
                </span>
              </div>
            </div>
          </div>
          <AvatarStack userIds={projectMemberIds} users={users} max={4} size={32} />
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
              className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {tab === "overview" && <OverviewTab projectId={project.id} />}
        {tab === "tasks" && <TasksTabClient projectId={project.id} onCardClick={setSelectedTaskId} />}
        {tab === "requests" && <RequestsTabClient projectId={project.id} clientId={client.id} onSelectRequest={setSelectedRequestId} />}
        {tab === "files" && <FilesTabClient projectId={project.id} />}
        {tab === "chat" && <ChatTabClient projectId={project.id} onOpenTask={setSelectedTaskId} />}
        {tab === "time" && <TimeTabClient projectId={project.id} onTaskClick={setSelectedTaskId} />}
      </div>

      <TaskDetailDrawerClient taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      <RequestDetailDrawerClient requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} clientId={client.id} />
    </AppShell>
  );
}

export default PortalProjectDetail;

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

/* ───── Overview ───── */

function OverviewTab({ projectId }: { projectId: string }) {
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);
  const { client } = useActiveClient();
  const clientAsUser = useClientAsUser(client);

  // The Team panel shows everyone actively contributing — management plus
  // anyone assigned to a task here — not just the Management list.
  const teamMemberIds = useMemo(() => {
    const taskAssignees = tasks.flatMap((t) => t.assignees);
    return Array.from(new Set([...project.team, ...taskAssignees]));
  }, [project.team, tasks]);

  const totalTasks = tasks.length;
  const breakdown = (["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => {
    const count = tasks.filter((x) => x.stage === s).length;
    const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
    return { stage: s, count, pct };
  });

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
                completed: "bg-emerald-400 dark:bg-emerald-500",
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
                todo: { dot: "bg-rose-400", bg: "hover:bg-rose-500/[0.03] hover:border-rose-500/25" },
                in_progress: { dot: "bg-amber-400", bg: "hover:bg-amber-500/[0.03] hover:border-amber-500/25" },
                in_review: { dot: "bg-sky-400", bg: "hover:bg-sky-500/[0.03] hover:border-sky-500/25" },
                completed: { dot: "bg-emerald-400", bg: "hover:bg-emerald-500/[0.03] hover:border-emerald-500/25" },
              }[stage];
              return (
                <div
                  key={stage}
                  className={cn(
                    "rounded-2xl border border-border/40 bg-background/50 p-4 transition-all duration-300 flex flex-col justify-between group select-none",
                    styles.bg,
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
                    <span className="text-2xl font-bold text-foreground">{count}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {count === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel p-6 bg-card border-border/60">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Team</h3>
          <div className="space-y-3">
            {teamMemberIds.map((id) => {
              const u = users.find((x) => x.id === id);
              if (!u) return null;
              return (
                <div key={id} className="flex items-center gap-3">
                  <UserAvatar user={u} size={32} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.title}</div>
                  </div>
                  {u.role === "manager" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Manager</span>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-3 border-t border-border/40 pt-3 mt-3">
              <UserAvatar user={clientAsUser} size={32} />
              <div className="flex-1">
                <div className="text-sm font-medium">{clientAsUser.name}</div>
                <div className="text-xs text-muted-foreground">{clientAsUser.title}</div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">You</span>
            </div>
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

/* ───── Tasks (read-only board + list) ───── */

function TasksTabClient({ projectId, onCardClick }: { projectId: string; onCardClick: (id: string) => void }) {
  const [activeView, setActiveView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);
  const stages: TaskStage[] = ["todo", "in_progress", "in_review", "completed"];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2.5 rounded-2xl border border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-9 w-48 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setActiveView("board")}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", activeView === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Board
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all", activeView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {activeView === "board" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => {
            const stageTasks = tasks
              .filter((t) => t.stage === stage && (!query || t.title.toLowerCase().includes(query.toLowerCase())))
              .sort((a, b) => dueDateSortValue(a.dueDate) - dueDateSortValue(b.dueDate));
            const meta = STAGE_META[stage];
            return (
              <div key={stage} className={cn(`${meta.tone} rounded-3xl p-4 border border-border/10`)}>
                <div className="mb-3 flex items-center gap-1.5 px-1 text-sm font-semibold">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  <span className={meta.pill}>{meta.label}</span>
                  <span className="ml-1 rounded-full bg-white/60 dark:bg-black/20 px-1.5 py-0.5 text-[10px]">{stageTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {stageTasks.map((task) => (
                    <div key={task.id} onClick={() => onCardClick(task.id)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                      <ReadOnlyTaskCard task={task} users={users} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel bg-card border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground bg-muted/20">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">Task Name</th>
                <th className="px-4 py-3 font-medium">Assignees</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks
                .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
                .sort((a, b) => dueDateSortValue(a.dueDate) - dueDateSortValue(b.dueDate))
                .map((t) => {
                  const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                  return (
                    <tr key={t.id} onClick={() => onCardClick(t.id)} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.title}</td>
                      <td className="px-4 py-3"><AvatarStack userIds={t.assignees} users={users} max={3} size={22} /></td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-card border border-border", STAGE_META[t.stage].pill)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_META[t.stage].dot)} />
                          {STAGE_META[t.stage].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pmeta.cls}`}>{pmeta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.dueDate || "—"}</td>
                    </tr>
                  );
                })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No tasks yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ReadOnlyTaskCard({ task, users }: { task: Task; users: User[] }) {
  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4">
      <div className="flex justify-between items-center gap-2">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${pmeta.cls}`}>{pmeta.label}</span>
        {task.dueDate && <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{task.dueDate}</span>}
      </div>
      <div className="mt-2 text-sm font-semibold leading-snug text-foreground">{task.title}</div>
      {task.note && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.note.replace(/<[^>]+>/g, "").trim()}</div>}
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

/* ───── Task detail (read-only, with client-visible discussion) ───── */

function TaskDetailDrawerClient({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { client } = useActiveClient();
  const clientAsUser = useClientAsUser(client);
  const tasks = useStore((s) => s.tasks);
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => (task ? projects.find((p) => p.id === task.projectId) : undefined), [projects, task]);
  const users = useStore((s) => s.users);
  const documents = useStore((s) => s.documents);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(
    () => allComments.filter((c) => c.threadId === taskId && c.visibility !== "internal"),
    [allComments, taskId],
  );
  const createComment = useStore((s) => s.createComment);

  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<RichAttachment[]>([]);
  const [previewFile, setPreviewFile] = useState<Document | null>(null);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const resolveUser = (authorId: string) => users.find((u) => u.id === authorId) || (authorId === clientAsUser.id ? clientAsUser : null);

  const creatorUser = useMemo(() => {
    if (!task) return null;
    const taskObj = task as any;
    if (taskObj.createdBy) return users.find((u) => u.id === taskObj.createdBy);
    if (project?.lead) return users.find((u) => u.id === project.lead);
    return users.find((u) => u.id === "u1");
  }, [task, project, users]);

  const taskDocuments = useMemo(() => {
    if (!task) return [] as Document[];
    // Client-visible comments only, so an internal-only reply's attachments
    // never leak into what the client can see here.
    const commentDocIds = comments.reduce((acc, c) => [...acc, ...(c.attachments ?? [])], [] as string[]);
    const directDocIds = task.attachmentDocIds ?? [];
    const realDocIds = Array.from(new Set([...directDocIds, ...commentDocIds]));
    const fromStore = documents.filter((d) => realDocIds.includes(d.id) && d.shared);
    if (fromStore.length > 0) return fromStore;

    // Legacy tasks only have a bare `attachments` count with no real documents
    // behind them yet — mirror the owner view's placeholder generation so the
    // client sees the same files instead of an empty section.
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

  const handleReply = () => {
    if (!task) return;
    if (!replyText.replace(/<[^>]+>/g, "").trim() && replyAttachments.length === 0) return;
    const docIds = replyAttachments.map((att) => {
      const doc = uploadDocument({
        projectId: task.projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: true,
      });
      return doc.id;
    });
    createComment({
      threadId: task.id,
      author: clientAsUser.id,
      body: replyText.trim(),
      visibility: "client",
      attachments: docIds,
    });
    setReplyText("");
    setReplyAttachments([]);
    toast.success("Reply posted");
  };

  if (!task) return null;
  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <>
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
          <SheetDescription className="sr-only">View details for task {task.title}</SheetDescription>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pmeta.cls)}>{pmeta.label}</span>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", STAGE_META[task.stage].tone, STAGE_META[task.stage].pill)}>
              {STAGE_META[task.stage].label}
            </span>
          </div>
          {project && (
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2 mb-1 px-0">
              {project.name}
            </div>
          )}
          <h2 className="text-lg font-semibold text-foreground m-0">{task.title}</h2>
          {task.createdAt && (
            <div className="text-xs text-muted-foreground mt-0 px-0">
              Created on{" "}
              {new Date(task.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              by {creatorUser?.name || "the team"}
            </div>
          )}
        </SheetHeader>

        <div className="mb-6">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Assignees</div>
          <AvatarStack userIds={task.assignees} users={users} max={6} size={28} />
        </div>

        {task.note && (
          <div className="mb-6">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</div>
            <div className="text-sm text-foreground/90 leading-relaxed rounded-2xl border border-border/60 bg-muted/20 p-4">
              <FormattedBody html={task.note} />
            </div>
          </div>
        )}

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
                      <div className="text-xs font-semibold text-foreground truncate" title={doc.name}>{doc.name}</div>
                      <div className="text-[10px] text-muted-foreground">{doc.size}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(doc)}
                      className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border/80 pt-6">
          <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center justify-between">
            <span>Thread Discussion</span>
            <span className="text-xs text-muted-foreground font-normal">{comments.length} comments</span>
          </h4>
          <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
            {comments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">No discussion yet. Write one below!</div>
            ) : (
              comments.map((c) => {
                const u = resolveUser(c.author);
                if (!u) return null;
                return (
                  <div key={c.id} className="flex gap-2.5 text-xs">
                    <UserAvatar user={u} size={24} />
                    <div className="flex-1 rounded-2xl px-3.5 py-2.5 bg-muted">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">{u.name}</span>
                        <span>{c.createdAt}</span>
                      </div>
                      <FormattedBody html={c.body} />
                      <CommentAttachmentsList attachmentIds={c.attachments} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <RichEditor
            value={replyText}
            onChange={setReplyText}
            attachments={replyAttachments}
            onAttachmentsChange={setReplyAttachments}
            placeholder="Post a reply..."
            minHeight={80}
            compact
            onSend={handleReply}
            sendDisabled={replyText.replace(/<[^>]+>/g, "").trim().length === 0 && replyAttachments.length === 0}
          />
        </div>
      </SheetContent>
    </Sheet>
    <FilePreviewDialog
      file={previewFile}
      onClose={() => setPreviewFile(null)}
      onDownload={() => previewFile && downloadDocument(previewFile)}
    />
    </>
  );
}

/* ───── Requests ───── */

function RequestsTabClient({ projectId, clientId, onSelectRequest }: { projectId: string; clientId: string; onSelectRequest: (id: string) => void }) {
  const allRequests = useStore((s) => s.requests);
  const requests = useMemo(() => allRequests.filter((r) => r.projectId === projectId && r.clientId === clientId), [allRequests, projectId, clientId]);

  if (requests.length === 0) {
    return (
      <div className="panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
        <Inbox className="h-6 w-6 text-muted-foreground/60" />
        No requests for this project yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {requests.map((r) => {
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
          <button
            key={r.id}
            onClick={() => onSelectRequest(r.id)}
            className={cn("group relative flex flex-col justify-between text-left rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}
          >
            <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300", accentCls.badge)}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2", accentCls.textHover)}>{r.title}</h3>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", sm.cls)}>{sm.label}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>{pm.label}</span>
                </div>
                <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">{tm.label}</span>
              </div>
              <div className="space-y-2.5">
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{stripHtml(r.description)}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{formatSubmissionTime(r.submittedAt)}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RequestDetailDrawerClient({ requestId, onClose, clientId }: { requestId: string | null; onClose: () => void; clientId: string }) {
  const { client } = useActiveClient();
  const clientAsUser = useClientAsUser(client);
  const requests = useStore((s) => s.requests);
  const req = useMemo(() => requests.find((r) => r.id === requestId), [requests, requestId]);
  const setStatus = useStore((s) => s.setRequestStatus);
  const users = useStore((s) => s.users);
  const documents = useStore((s) => s.documents);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === requestId && c.visibility !== "internal"), [allComments, requestId]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const requestDocuments = useMemo(() => {
    if (!req) return [] as Document[];
    const ids = req.attachmentDocIds ?? [];
    return documents.filter((d) => ids.includes(d.id) && d.shared);
  }, [req, documents]);

  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<RichAttachment[]>([]);
  const [previewFile, setPreviewFile] = useState<Document | null>(null);

  const resolveUser = (authorId: string) => users.find((u) => u.id === authorId) || (authorId === clientAsUser.id ? clientAsUser : null);

  const handleReply = () => {
    if (!req) return;
    if (!replyText.replace(/<[^>]+>/g, "").trim() && replyAttachments.length === 0) return;
    const docIds = replyAttachments.map((att) => {
      const doc = uploadDocument({ projectId: req.projectId || "", name: att.name, folder: "Attachments", size: formatBytes(att.size), shared: true });
      return doc.id;
    });
    createComment({ threadId: req.id, author: clientAsUser.id, body: replyText.trim(), visibility: "client", attachments: docIds });
    setReplyText("");
    setReplyAttachments([]);
    toast.success("Reply posted");
  };

  if (!req) return null;
  const tm = REQUEST_TYPE_META[req.type];
  const pm = PRIORITY_META[req.priority];
  const sm = REQUEST_STATUS_META[req.status];

  return (
    <>
    <Sheet open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80 flex flex-col justify-between h-full">
        <div className="space-y-6">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="sr-only">Request Details: {req.title}</SheetTitle>
            <SheetDescription className="sr-only">View details and discussion for request {req.title}</SheetDescription>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", sm.cls)}>{sm.label}</span>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">{tm.label}</span>
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pm.cls)}>{pm.label}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground m-0">{req.title}</h2>
            {req.submittedAt && <div className="text-xs text-muted-foreground mt-0">{formatSubmissionTime(req.submittedAt)}</div>}
          </SheetHeader>

          {req.description && (
            <div className="mb-6">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</div>
              <div className="text-sm text-foreground/90 leading-relaxed rounded-2xl border border-border/60 bg-muted/20 p-4">
                <FormattedBody html={req.description} />
              </div>
            </div>
          )}

          {requestDocuments.length > 0 && (
            <div className="border-t border-border/80 pt-6 mt-6 mb-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Attachments</span>
                <span className="text-xs text-muted-foreground font-normal capitalize tracking-normal">
                  {requestDocuments.length} {requestDocuments.length === 1 ? "file" : "files"}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requestDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-2.5 rounded-xl transition-all group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                        {doc.name.split(".").pop()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate" title={doc.name}>{doc.name}</div>
                        <div className="text-[10px] text-muted-foreground">{doc.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(doc)}
                        className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border/80 pt-6">
            <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center justify-between">
              <span>Thread Discussion</span>
              <span className="text-xs text-muted-foreground font-normal">{comments.length} comments</span>
            </h4>
            <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
              {comments.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">No discussion comments yet. Write one below!</div>
              ) : (
                comments.map((c) => {
                  const u = resolveUser(c.author);
                  if (!u) return null;
                  return (
                    <div key={c.id} className="flex gap-2.5 text-xs">
                      <UserAvatar user={u} size={24} />
                      <div className="flex-1 rounded-2xl px-3.5 py-2.5 bg-muted">
                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{u.name}</span>
                          <span>{c.createdAt}</span>
                        </div>
                        <FormattedBody html={c.body} />
                        <CommentAttachmentsList attachmentIds={c.attachments} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <RichEditor
              value={replyText}
              onChange={setReplyText}
              attachments={replyAttachments}
              onAttachmentsChange={setReplyAttachments}
              placeholder="Post a reply..."
              minHeight={80}
              compact
              onSend={handleReply}
              sendDisabled={replyText.replace(/<[^>]+>/g, "").trim().length === 0 && replyAttachments.length === 0}
            />
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 border-t border-border/40 pt-4 mt-6">
          <button onClick={onClose} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted cursor-pointer transition-all">
            Cancel
          </button>
          <button
            onClick={() => {
              setStatus(req.id, "withdrawn");
              toast.success("Request withdrawn");
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 cursor-pointer transition-all"
          >
            Withdraw request
          </button>
        </div>
      </SheetContent>
    </Sheet>
    <FilePreviewDialog
      file={previewFile}
      onClose={() => setPreviewFile(null)}
      onDownload={() => previewFile && downloadDocument(previewFile)}
    />
    </>
  );
}

/* ───── Files (shared only, read-only) ───── */

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function FilesTabClient({ projectId }: { projectId: string }) {
  const allDocuments = useStore((s) => s.documents);
  const documents = useMemo(
    () => allDocuments.filter((d) => d.projectId === projectId && d.name !== ".keep" && d.shared),
    [allDocuments, projectId],
  );
  const [query, setQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const filtered = documents.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2.5 rounded-2xl border border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="h-9 w-48 rounded-full border border-border bg-card pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
          <FileText className="h-6 w-6 text-muted-foreground/60" />
          No files have been shared for this project yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-card border border-border/50 p-3.5 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                  {getFileExt(doc.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate" title={doc.name}>{doc.name}</div>
                  <div className="text-[11px] text-muted-foreground">{doc.folder} · {doc.size}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isPreviewableFile(doc.name) && (
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                    title="Preview file"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); downloadDocument(doc); }}
                  className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilePreviewDialog
        file={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={() => previewDoc && downloadDocument(previewDoc)}
      />
    </div>
  );
}

/* ───── Chat (project general + task threads, client-visible only) ───── */

function ChatTabClient({ projectId, onOpenTask }: { projectId: string; onOpenTask: (id: string) => void }) {
  const { client } = useActiveClient();
  const clientAsUser = useClientAsUser(client);
  const [activeThreadId, setActiveThreadId] = useState<string>(projectId);
  const [chatSearch, setChatSearch] = useState("");

  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.visibility !== "internal"), [allComments]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const users = useStore((s) => s.users);

  const messageLogRef = useRef<HTMLDivElement>(null);

  const activeComments = useMemo(() => comments.filter((c) => c.threadId === activeThreadId), [comments, activeThreadId]);

  useEffect(() => {
    if (messageLogRef.current) messageLogRef.current.scrollTop = messageLogRef.current.scrollHeight;
  }, [activeThreadId, activeComments]);

  const resolveUser = (authorId: string) => users.find((u) => u.id === authorId) || (authorId === clientAsUser.id ? clientAsUser : null);

  const activeTitle = useMemo(() => {
    if (activeThreadId === projectId) return "Project General Chat";
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

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);

  const send = () => {
    const plain = body.replace(/<[^>]+>/g, "").trim();
    if (!plain && attachments.length === 0) return;
    const docIds = attachments.map((att) => {
      const doc = uploadDocument({ projectId, name: att.name, folder: "Attachments", size: formatBytes(att.size), shared: true });
      return doc.id;
    });
    createComment({ threadId: activeThreadId, author: clientAsUser.id, body, visibility: "client", attachments: docIds });
    setBody("");
    setAttachments([]);
    toast.success("Message sent");
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
            className={cn("flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer", activeThreadId === projectId ? "bg-primary text-primary-foreground " : "hover:bg-muted text-muted-foreground hover:text-foreground")}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1 truncate">
              <div>Project General Chat</div>
              <div className="text-[10px] opacity-75 font-normal truncate">General discussion, briefs & feedback</div>
            </div>
            {comments.filter((c) => c.threadId === projectId).length > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeThreadId === projectId ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20 text-foreground")}>
                {comments.filter((c) => c.threadId === projectId).length}
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
                className={cn("flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer", activeThreadId === t.id ? "bg-primary text-primary-foreground " : "hover:bg-muted text-muted-foreground hover:text-foreground")}
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
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-muted/5">
          <div>
            <div className="text-sm font-bold text-foreground">{activeTitle}</div>
            <div className="text-xs text-muted-foreground leading-normal mt-0.5">Unified thread log · updates synced automatically</div>
          </div>
          {activeThreadId !== projectId && (() => {
            const task = tasks.find((t) => t.id === activeThreadId);
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

        <div ref={messageLogRef} className="flex-1 max-h-[360px] overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activeComments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/45" />
              <p className="text-sm font-medium">No messages posted in this thread yet.</p>
              <p className="text-xs text-muted-foreground/75 mt-0.5">Use the comment box below to update your team.</p>
            </div>
          ) : (
            activeComments.map((m) => {
              const u = resolveUser(m.author);
              if (!u) return null;
              return (
                <div key={m.id} className="flex gap-3 text-sm">
                  <UserAvatar user={u} size={32} />
                  <div className="flex-1 rounded-2xl px-4 py-3 border border-border/40 bg-muted/40 transition-all hover:border-border/85">
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-muted-foreground">{m.createdAt}</span>
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

        <div className="border-t border-border p-4 bg-muted/5">
          <RichEditor
            value={body}
            onChange={setBody}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            placeholder="Type your message..."
            minHeight={90}
            onSend={send}
            sendDisabled={body.replace(/<[^>]+>/g, "").trim().length === 0 && attachments.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

/* ───── Time (read-only, scoped to this project) ───── */

type TimeTabClientSortField = "date" | "member" | "task" | "hours" | "billable";

function TimeTabClient({ projectId, onTaskClick }: { projectId: string; onTaskClick?: (id: string) => void }) {
  const allTimeEntries = useStore((s) => s.timeEntries);
  const projectEntries = useMemo(() => allTimeEntries.filter((t) => t.projectId === projectId), [allTimeEntries, projectId]);
  const users = useStore((s) => s.users);
  const allTasks = useStore((s) => s.tasks);
  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === projectId), [allTasks, projectId]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [sortBy, setSortBy] = useState<TimeTabClientSortField>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: TimeTabClientSortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      { id: "billable", label: "Billable", options: [{ value: "yes", label: "Billable" }, { value: "no", label: "Non-billable" }] as FilterOption[] },
    ],
    [],
  );

  const filteredEntries = useMemo(() => {
    const result = projectEntries.filter((e) => {
      if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.billable?.length) {
        const v = filters.billable[0];
        if (v === "yes" && !e.billable) return false;
        if (v === "no" && e.billable) return false;
      }
      if (!inRange(e.date, dateRange)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === "member") {
        valA = users.find((u) => u.id === a.userId)?.name || "";
        valB = users.find((u) => u.id === b.userId)?.name || "";
      } else if (sortBy === "task") {
        valA = (a.taskId ? tasks.find((t) => t.id === a.taskId)?.title : "") || "";
        valB = (b.taskId ? tasks.find((t) => t.id === b.taskId)?.title : "") || "";
      } else if (sortBy === "hours") {
        valA = a.hours;
        valB = b.hours;
      } else if (sortBy === "billable") {
        valA = a.billable ? 1 : 0;
        valB = b.billable ? 1 : 0;
      } else {
        valA = new Date(a.date).getTime() || 0;
        valB = new Date(b.date).getTime() || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [projectEntries, search, filters.billable, dateRange, sortBy, sortOrder, users, tasks]);

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
        />
      </div>

      <div className="panel overflow-hidden">
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
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th onClick={() => handleSort("date")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("member")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Team {sortBy === "member" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("task")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Task {sortBy === "task" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 font-medium select-none">Note / Work Done</th>
                  <th onClick={() => handleSort("hours")} className="px-5 py-3 font-medium text-right cursor-pointer hover:text-foreground select-none">
                    Hours {sortBy === "hours" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("billable")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Status {sortBy === "billable" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => {
                  const u = users.find((x) => x.id === e.userId);
                  const assocTask = e.taskId ? tasks.find((t) => t.id === e.taskId) : null;
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground font-medium whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                          {u && <UserAvatar user={u} size={24} />}
                          <span className="text-foreground font-semibold">{u?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {assocTask ? (
                          <button
                            onClick={() => onTaskClick?.(assocTask.id)}
                            className="hover:text-primary transition-colors font-medium cursor-pointer text-left"
                          >
                            {assocTask.title}
                          </button>
                        ) : (
                          <span className="font-medium text-muted-foreground/50">No task</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground font-medium">
                        {e.note || <span className="italic text-muted-foreground/30 font-normal">No note provided</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground font-semibold">{parseFloat(e.hours.toFixed(2))}h</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", e.billable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/10")}>
                          {e.billable ? "Billable" : "Non-billable"}
                        </span>
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
