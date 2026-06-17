"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import { useStore, type StorageConnection } from "@/lib/store";
import {
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  DELIVERABLE_STATUS_META,
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
  PackageCheck,
  Inbox,
  FileText,
  LayoutDashboard,
  ListTodo,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  HardDrive,
  Cloud,
  Send,
  Upload,
  Trash2,
  Table,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AppDialog, TextField, SelectField, FieldGroup, FieldLabel } from "@/components/ui/app-dialog";
import { RichEditor } from "@/components/rich-editor";
import { celebrateFromElement } from "@/lib/confetti";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Files", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ProjectDetail() {
  const params = useParams();
  const projectId = params?.projectId as string;
  
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => project ? clients.find((c) => c.id === project.clientId) : undefined, [clients, project]);
  
  const [tab, setTab] = useState<TabId>("tasks");

  if (!project) throw notFound();
  if (!client) throw notFound();

  return (
    <AppShell>
      <Link href="/owner/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="panel p-6 bg-card/50 backdrop-blur-sm border-border/60 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-${project.accent} text-2xl font-semibold text-white`}>
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
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
              <SettingsIcon className="h-3.5 w-3.5" /> Settings
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
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
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {tab === "overview" && <Overview projectId={project.id} />}
        {tab === "tasks" && <TasksTab projectId={project.id} />}
        {tab === "requests" && <RequestsTab projectId={project.id} />}
        {tab === "files" && <FilesTab projectId={project.id} />}
        {tab === "chat" && <ChatTab projectId={project.id} />}
        {tab === "storage" && <StorageTab projectId={project.id} />}
        {tab === "time" && <TimeTab projectId={project.id} />}
      </div>
    </AppShell>
  );
}

function Overview({ projectId }: { projectId: string }) {
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const allTasks = useStore((s) => s.tasks);
  const t = useMemo(() => allTasks.filter((x) => x.projectId === projectId), [allTasks, projectId]);
  const users = useStore((s) => s.users);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="panel p-6 bg-card border-border/60 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">About</h3>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Progress" value={`${project.progress}%`} tone="bg-progress text-progress-foreground" />
          <StatBox label="Hours" value={`${project.hoursLogged}/${project.hoursEstimate}`} tone="bg-review text-review-foreground" />
          <StatBox label="Budget" value={`$${(project.spent / 1000).toFixed(0)}k / $${(project.budget / 1000).toFixed(0)}k`} tone="bg-done text-done-foreground" />
          <StatBox label="Type" value={project.type === "fixed" ? "Fixed price" : "Hourly"} tone="bg-todo text-todo-foreground" />
        </div>
        <div className="panel p-6 bg-card border-border/60 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Task breakdown</h3>
          <div className="grid grid-cols-4 gap-3">
            {(["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => (
              <div key={s} className={cn("rounded-2xl p-4 transition-all hover:scale-[1.02]", STAGE_META[s].tone)}>
                <div className={`text-[11px] font-semibold ${STAGE_META[s].pill}`}>{STAGE_META[s].label}</div>
                <div className="mt-1 text-2xl font-semibold">{t.filter((x) => x.stage === s).length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="panel p-6 bg-card border-border/60 shadow-sm">
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
          </div>
        </div>
        <div className="panel p-6 bg-card border-border/60 shadow-sm">
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

function StatBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl p-4 transition-all hover:scale-[1.02]", tone)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

/* ───── Tasks Tab (Kanban / List / Calendar Switcher) ───── */

function TasksTab({ projectId }: { projectId: string }) {
  const [activeView, setActiveView] = useState<"board" | "list" | "calendar">("board");
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
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
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all",
                activeView === "board" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Board
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all",
                activeView === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              List
            </button>
            <button
              onClick={() => setActiveView("calendar")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all",
                activeView === "calendar" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
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
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
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

      {/* Task Details Drawer */}
      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

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
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
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
      className="cursor-grab rounded-2xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-all active:cursor-grabbing"
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
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.note}</div>
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
    <div className="panel p-2 bg-card border-border/60 shadow-sm overflow-hidden">
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
    <div className="panel p-4 bg-card border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/30">
          <button onClick={prevMonth} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
            }}
            className="px-2.5 py-1 text-xs font-semibold hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 border-b border-border pb-2 text-center text-xs font-semibold text-muted-foreground">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1 bg-muted/10 mt-1">
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
                "min-h-[110px] border border-border/30 p-2 bg-card flex flex-col justify-between transition-colors hover:bg-muted/5 relative",
                !cell.currentMonth && "opacity-30"
              )}
            >
              <div className="text-right text-xs font-semibold text-muted-foreground/80 mb-1 select-none">
                {cell.day}
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] scrollbar-thin">
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
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold truncate cursor-pointer transition-shadow hover:shadow-sm",
                      STAGE_META[t.stage].tone,
                      STAGE_META[t.stage].pill
                    )}
                  >
                    {t.title}
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

function TaskDetailsDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const tasks = useStore((s) => s.tasks);
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const updateTask = useStore((s) => s.updateTask);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === taskId), [allComments, taskId]);

  const teamMembers = users.filter((u) => u.role !== "client");

  if (!task) return null;

  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto w-full p-6 bg-card border-l border-border/80 shadow-2xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pmeta.cls)}>
              {pmeta.label}
            </span>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground")}>
              {STAGE_META[task.stage].label}
            </span>
          </div>
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-primary rounded px-1 text-foreground"
          />
        </SheetHeader>

        {/* Form fields */}
        <div className="space-y-4 text-sm border-b border-border pb-6 mb-6">
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={task.stage}
              onChange={(e) => updateTask(task.id, { stage: e.target.value as TaskStage })}
              className="col-span-2 rounded border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
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
              className="col-span-2 rounded border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
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
              type="text"
              value={task.dueDate}
              placeholder="e.g. Jun 18"
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
              className="col-span-2 rounded border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-start">
            <span className="text-muted-foreground font-medium pt-1">Assignees:</span>
            <div className="col-span-2 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {teamMembers.map((m) => {
                const assigned = task.assignees.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer hover:text-primary transition-colors">
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
                    <span>{m.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
          <textarea
            value={task.note}
            onChange={(e) => updateTask(task.id, { note: e.target.value })}
            placeholder="Add detailed description notes here..."
            className="w-full min-h-[90px] rounded border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
          />
        </div>

        {/* Discussion Feed */}
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
                      <p className="text-sm text-foreground/90 leading-relaxed">{c.body}</p>
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
      </SheetContent>
    </Sheet>
  );
}

function NewCommentForm({ threadId }: { threadId: string }) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const createComment = useStore((s) => s.createComment);

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    createComment({
      threadId,
      author: "u1", // Owner: Jordan Reyes
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
    });
    setCommentText("");
    toast.success("Comment posted successfully");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      placeholder="Post a reply..."
      minHeight={80}
      compact
      footer={
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
            />
            <span>Internal only</span>
          </label>
          <button
            onClick={handleSubmit}
            disabled={!isEnabled}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-all cursor-pointer"
          >
            Send
          </button>
        </div>
      }
    />
  );
}

/* ───── Requests Tab ───── */

function RequestsTab({ projectId }: { projectId: string }) {
  const allRequests = useStore((s) => s.requests);
  const requests = useMemo(() => allRequests.filter((r) => r.projectId === projectId), [allRequests, projectId]);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {requests.length === 0 && <EmptyState icon={Inbox} label="No requests for this project yet" />}
      {requests.map((r) => (
        <div key={r.id} className="panel p-5 bg-card border-border/60 shadow-sm transition-all hover:scale-[1.01]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_META[r.status].cls}`}>
              {REQUEST_STATUS_META[r.status].label}
            </span>
            <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
          </div>
          <div className="text-sm font-semibold text-foreground">{r.title}</div>
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ───── Centralized Files Tab ───── */

function FilesTab({ projectId }: { projectId: string }) {
  const allDeliverables = useStore((s) => s.deliverables);
  const deliverables = useMemo(() => allDeliverables.filter((d) => d.projectId === projectId), [allDeliverables, projectId]);
  const allDocuments = useStore((s) => s.documents);
  const documents = useMemo(() => allDocuments.filter((d) => d.projectId === projectId && d.name !== ".keep"), [allDocuments, projectId]);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const updateDocument = useStore((s) => s.updateTask); // Reuse or custom update logic
  const users = useStore((s) => s.users);

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [fileQuery, setFileQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFile, setNewFile] = useState({
    name: "",
    folder: "Assets",
    size: "1.5 MB",
    shared: false,
  });

  const folders = useMemo(() => {
    const list = Array.from(new Set(documents.map((d) => d.folder)));
    if (deliverables.length > 0) {
      list.push("Deliverables");
    }
    return list;
  }, [documents, deliverables]);

  const handleUploadFile = () => {
    if (!newFile.name.trim()) {
      toast.error("File name is required");
      return;
    }
    uploadDocument({
      projectId,
      name: newFile.name.trim(),
      folder: newFile.folder,
      size: newFile.size,
      shared: newFile.shared,
    });
    setNewFile({ name: "", folder: "Assets", size: "1.5 MB", shared: false });
    setUploadOpen(false);
    toast.success("File uploaded successfully");
  };

  const allFiles = useMemo(() => {
    const arr: Array<{
      id: string;
      name: string;
      size: string;
      folder: string;
      uploadedBy: string;
      uploadedAt: string;
      shared: boolean;
      type: "deliverable" | "document";
      thumbnail?: string;
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
      });
    });

    deliverables.forEach((d) => {
      arr.push({
        id: d.id,
        name: d.title,
        size: "Package",
        folder: "Deliverables",
        uploadedBy: "u2", // Design Lead
        uploadedAt: d.updatedAt,
        shared: d.status === "approved" || d.status === "client_review",
        type: "deliverable",
        thumbnail: d.thumbnail,
      });
    });

    return arr;
  }, [documents, deliverables]);

  const filteredFiles = useMemo(() => {
    return allFiles.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(fileQuery.toLowerCase());
      const matchFolder = selectedFolder ? f.folder === selectedFolder : true;
      return matchSearch && matchFolder;
    });
  }, [allFiles, fileQuery, selectedFolder]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Folder sidebar */}
      <div className="panel p-4 lg:col-span-1 bg-card border-border/60 shadow-sm h-fit">
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
          
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors cursor-pointer",
                selectedFolder === f ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="inline-flex items-center gap-2"><FolderOpen className="h-4 w-4" /> {f}</span>
              <span>{allFiles.filter((x) => x.folder === f).length}</span>
            </button>
          ))}
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

          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Upload file
          </button>
        </div>

        {/* Files Grid / List */}
        {filteredFiles.length === 0 ? (
          <div className="panel p-12 text-center text-muted-foreground bg-card/50">
            No files available in this directory. Click 'Upload file' to manually add assets.
          </div>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="panel overflow-hidden bg-card border-border/60 shadow-sm flex flex-col justify-between group transition-shadow hover:shadow-md">
                {file.type === "deliverable" ? (
                  <div className={cn("h-28 bg-gradient-to-br", file.thumbnail || "from-blue-500 to-indigo-600")} />
                ) : (
                  <div className="h-28 bg-muted/40 flex items-center justify-center relative">
                    <FileText className="h-10 w-10 text-muted-foreground/70" />
                    <span className="absolute top-2 right-2 text-[9px] font-semibold bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">{file.folder}</span>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground truncate">{file.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{file.size} · {file.uploadedAt}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      {file.shared ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold"><Eye className="h-3 w-3" /> Client Shared</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Lock className="h-3 w-3" /> Internal Only</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          toast.success("Download started", { description: file.name });
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {file.type === "document" && (
                        <button
                          onClick={() => {
                            deleteDocument(file.id);
                            toast.success("File deleted successfully");
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel p-2 bg-card border-border/60 shadow-sm overflow-hidden">
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
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-xs">{file.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{file.folder}</td>
                      <td className="px-4 py-3 text-muted-foreground">{file.size}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u ? u.name.split(" ")[0] : "System"} · {file.uploadedAt}
                      </td>
                      <td className="px-4 py-3">
                        {file.shared ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold"><Eye className="h-3 w-3" /> Client</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Internal</span>
                        )}
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
                          {file.type === "document" && (
                            <button
                              onClick={() => {
                                deleteDocument(file.id);
                                toast.success("File deleted successfully");
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Upload File Dialog */}
      <AppDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload project file"
        description="Save design sheets, briefing docs, or time audits directly to this project's archive."
        icon={<Upload className="h-5 w-5" />}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              onClick={() => setUploadOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadFile}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
            >
              Upload
            </button>
          </div>
        }
      >
        <FieldGroup>
          <TextField
            label="File Name"
            placeholder="e.g. Brand-Guidelines-v2.pdf"
            value={newFile.name}
            onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Directory Folder"
              value={newFile.folder}
              onChange={(e) => setNewFile({ ...newFile, folder: e.target.value })}
            >
              <option value="Briefs">Briefs</option>
              <option value="Design">Design</option>
              <option value="Assets">Assets</option>
              <option value="Attachments">Attachments</option>
            </SelectField>
            <TextField
              label="Mock File Size"
              value={newFile.size}
              onChange={(e) => setNewFile({ ...newFile, size: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={newFile.shared}
              onChange={(e) => setNewFile({ ...newFile, shared: e.target.checked })}
              className="h-4 w-4 accent-primary rounded"
            />
            <span>Share file visibility with clients</span>
          </label>
        </FieldGroup>
      </AppDialog>
    </div>
  );
}

/* ───── Two-Column Chat System Tab ───── */

function ChatTab({ projectId }: { projectId: string }) {
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
      return matchSearch;
    });
  }, [tasks, chatSearch]);

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
    <div className="panel overflow-hidden bg-card border-border/60 shadow-sm grid grid-cols-1 md:grid-cols-3 min-h-[520px]">
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

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[440px] scrollbar-thin">
          <button
            onClick={() => setActiveThreadId(projectId)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer",
              activeThreadId === projectId ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
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
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer",
                  activeThreadId === t.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
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
          {activeThreadId !== projectId && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border border-border bg-card", STAGE_META[tasks.find(t=>t.id===activeThreadId)?.stage || "todo"].pill)}>
              {STAGE_META[tasks.find(t=>t.id===activeThreadId)?.stage || "todo"].label}
            </span>
          )}
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
                  <div className={cn("flex-1 rounded-2xl px-4 py-3 border border-border/40 shadow-sm transition-all hover:border-border/85", internal ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/40")}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-muted-foreground">{m.createdAt}</span>
                      {internal && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/45 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                          <Lock className="h-2.5 w-2.5" /> Internal only
                        </span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90">{m.body}</div>
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
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
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
  const createComment = useStore((s) => s.createComment);

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    createComment({
      threadId,
      author: "u1", // Owner: Jordan Reyes
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
    });
    setCommentText("");
    toast.success("Comment posted");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      placeholder="Type your message, post progress, or ask queries..."
      minHeight={100}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none font-semibold">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
              />
              <span>Internal only</span>
            </label>

            <button
              type="button"
              onClick={onAttachClick}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 px-2.5 py-1 rounded-full border border-border/60 transition-all cursor-pointer font-semibold"
            >
              <Paperclip className="h-3.5 w-3.5" /> Attach
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isEnabled}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <Send className="h-3 w-3" /> Send
          </button>
        </div>
      }
    />
  );
}

/* ───── Storage Integration Tab ───── */

function StorageTab({ projectId }: { projectId: string }) {
  const connections = useStore((s) => s.storageConnections);
  const connectStorage = useStore((s) => s.connectStorage);
  const disconnectStorage = useStore((s) => s.disconnectStorage);

  const [connectOpen, setConnectOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<"gdrive" | "dropbox" | "onedrive" | "box" | null>(null);
  const [emailInput, setEmailInput] = useState("");

  const providers = [
    {
      provider: "gdrive" as const,
      name: "Google Drive",
      desc: "Sync briefs, sheets, slides, and shared customer files dynamically into the local Files tab.",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: Cloud,
    },
    {
      provider: "dropbox" as const,
      name: "Dropbox",
      desc: "Access brand directories, design assets, and large raw creative archives directly within project tasks.",
      color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      icon: FolderOpen,
    },
    {
      provider: "onedrive" as const,
      name: "Microsoft OneDrive",
      desc: "Synchronize company documents, sheets, and marketing copies automatically with key deadlines.",
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      icon: Cloud,
    },
    {
      provider: "box" as const,
      name: "Box Secure Storage",
      desc: "Safely catalog documents, external media packets, and secure folders with enterprise-grade vaults.",
      color: "bg-blue-600/10 text-blue-700 border-blue-600/20",
      icon: HardDrive,
    },
  ];

  const handleConnect = () => {
    if (!activeProvider || !emailInput.trim()) {
      toast.error("Account email is required to sync syncs");
      return;
    }
    connectStorage(activeProvider, emailInput.trim());
    setEmailInput("");
    setConnectOpen(false);
    toast.success(`Connected ${providers.find(p => p.provider === activeProvider)?.name} successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6 bg-card border-border/60 shadow-sm max-w-3xl">
        <h3 className="text-lg font-bold text-foreground">External Storage Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Link external cloud storage suites to your project directory. This enables team members to drop external file assets directly into task details, comments, and project briefs, maintaining a single cohesive source of truth.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {providers.map((p) => {
          const conn = connections.find((c) => c.provider === p.provider)!;
          const Icon = p.icon;
          return (
            <div key={p.provider} className="panel p-5 bg-card border-border/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", p.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    conn.connected ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                  )}>
                    {conn.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                
                {conn.connected && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Linked Account:</span>
                      <span className="font-semibold text-foreground">{conn.email}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Connected On:</span>
                      <span className="font-semibold text-foreground">{conn.connectedAt}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-border/40 pt-4 flex justify-end">
                {conn.connected ? (
                  <button
                    onClick={() => {
                      disconnectStorage(p.provider);
                      toast.info(`Disconnected from ${p.name}`);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-rose-200 dark:border-rose-950/45 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveProvider(p.provider);
                      setConnectOpen(true);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Storage Dialog */}
      <AppDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        title={`Connect Cloud Storage`}
        description={`Authorise account details to sync directories from this cloud provider.`}
        icon={<Cloud className="h-5 w-5" />}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              onClick={() => setConnectOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
            >
              Authorise Connection
            </button>
          </div>
        }
      >
        <FieldGroup>
          <TextField
            label="Account Email"
            placeholder="e.g. workspace@company.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            type="email"
            autoFocus
          />
        </FieldGroup>
      </AppDialog>
    </div>
  );
}

/* ───── Time Entries Tab ───── */

function TimeTab({ projectId }: { projectId: string }) {
  const allTimeEntries = useStore((s) => s.timeEntries);
  const entries = useMemo(() => allTimeEntries.filter((t) => t.projectId === projectId).slice(0, 20), [allTimeEntries, projectId]);
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === projectId)!, [projects, projectId]);
  const users = useStore((s) => s.users);
  
  const logged = entries.reduce((s, t) => s + t.hours, 0);
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 panel p-2 bg-card border-border/60 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground bg-muted/20">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Billable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const u = users.find((x) => x.id === e.userId)!;
              return (
                <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2"><UserAvatar user={u} size={20} /> {u.name.split(" ")[0]}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.note}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.hours}h</td>
                  <td className="px-4 py-3">
                    {e.billable ? (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/45 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Billable</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-6">
        <div className="panel p-5 bg-card border-border/60 shadow-sm">
          <div className="text-xs text-muted-foreground">Logged this view</div>
          <div className="mt-1 text-3xl font-semibold text-foreground">{logged.toFixed(1)}h</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(project.hoursLogged / project.hoursEstimate) * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground leading-normal">
            {project.hoursLogged}h logged of {project.hoursEstimate}h estimate
          </div>
        </div>
        <div className="panel p-5 bg-card border-border/60 shadow-sm">
          <div className="text-xs text-muted-foreground">Budget</div>
          <div className="mt-1 text-3xl font-semibold text-foreground">${(project.spent / 1000).toFixed(0)}k</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(project.spent / project.budget) * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground leading-normal">
            of ${(project.budget / 1000).toFixed(0)}k budget
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
