import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import {
  projects,
  clients,
  users,
  tasksByProject,
  requests,
  deliverables,
  documents,
  messages,
  channels,
  timeEntries,
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  DELIVERABLE_STATUS_META,
  type TaskStage,
  type Task,
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
  Calendar,
  FolderOpen,
  Clock,
  PackageCheck,
  Inbox,
  FileText,
  LayoutDashboard,
  ListTodo,
  Lock,
  Eye,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId")({
  component: ProjectDetail,
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "board", label: "Board", icon: ListTodo },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "deliverables", label: "Deliverables", icon: PackageCheck },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();
  const client = clients.find((c) => c.id === project.clientId)!;
  const [tab, setTab] = useState<TabId>("board");

  return (
    <AppShell>
      <Link to="/app/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-${project.accent} text-2xl font-semibold`}>
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
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted">
              <SettingsIcon className="h-3.5 w-3.5" /> Settings
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview projectId={project.id} />}
      {tab === "board" && <KanbanBoard projectId={project.id} />}
      {tab === "requests" && <RequestsTab projectId={project.id} />}
      {tab === "deliverables" && <DeliverablesTab projectId={project.id} />}
      {tab === "documents" && <DocumentsTab projectId={project.id} />}
      {tab === "messages" && <MessagesTab projectId={project.id} />}
      {tab === "time" && <TimeTab projectId={project.id} />}
    </AppShell>
  );
}

function Overview({ projectId }: { projectId: string }) {
  const project = projects.find((p) => p.id === projectId)!;
  const t = tasksByProject(projectId);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="panel p-6">
          <h3 className="mb-2 text-lg font-semibold">About</h3>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatBox label="Progress" value={`${project.progress}%`} tone="bg-progress" />
          <StatBox label="Hours" value={`${project.hoursLogged}/${project.hoursEstimate}`} tone="bg-review" />
          <StatBox label="Budget" value={`$${(project.spent / 1000).toFixed(0)}k / $${(project.budget / 1000).toFixed(0)}k`} tone="bg-done" />
          <StatBox label="Type" value={project.type === "fixed" ? "Fixed price" : "Hourly"} tone="bg-todo" />
        </div>
        <div className="panel p-6">
          <h3 className="mb-3 text-lg font-semibold">Task breakdown</h3>
          <div className="grid grid-cols-4 gap-3">
            {(["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => (
              <div key={s} className={`${STAGE_META[s].tone} rounded-2xl p-4`}>
                <div className={`text-[11px] font-semibold ${STAGE_META[s].pill}`}>{STAGE_META[s].label}</div>
                <div className="mt-1 text-2xl font-semibold">{t.filter((x) => x.stage === s).length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="panel p-6">
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
        <div className="panel p-6">
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
    <div className={`${tone} rounded-2xl p-4`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

/* ───── Kanban Board ───── */

function KanbanBoard({ projectId }: { projectId: string }) {
  const initial = useMemo(() => tasksByProject(projectId), [projectId]);
  const [taskList, setTaskList] = useState<Task[]>(initial);
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const stages: TaskStage[] = ["todo", "in_progress", "in_review", "completed"];

  function onDrop(stage: TaskStage) {
    if (!dragId) return;
    setTaskList((list) =>
      list.map((t) => (t.id === dragId ? { ...t, stage, progress: stage === "completed" ? 100 : t.progress } : t)),
    );
    setDragId(null);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task"
              className="h-10 w-64 rounded-full border border-border bg-card pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">Sort by:</div>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm">
            Stage
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add new task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => {
          const stageTasks = taskList.filter(
            (t) => t.stage === stage && (!query || t.title.toLowerCase().includes(query.toLowerCase())),
          );
          const meta = STAGE_META[stage];
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage)}
              className={`${meta.tone} rounded-3xl p-4 transition-colors`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${meta.pill}`}>
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="ml-1 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px]">{stageTasks.length}</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                {stageTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                  />
                ))}
                <button className="flex w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-foreground/15 bg-white/40 py-2 text-xs text-muted-foreground hover:bg-white/70">
                  <Plus className="h-3 w-3" /> Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function KanbanCard({
  task,
  draggable,
  onDragStart,
}: {
  task: Task;
  draggable?: boolean;
  onDragStart?: () => void;
}) {
  const pmeta = PRIORITY_META[task.priority];
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="cursor-grab rounded-2xl bg-white p-4 soft-shadow transition-transform active:cursor-grabbing active:scale-[0.98]"
    >
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${pmeta.cls}`}>
        {pmeta.label}
      </span>
      <div className="mt-2 text-sm font-semibold leading-snug">{task.title}</div>
      {task.note && (
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">Note: {task.note}</div>
      )}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span>{task.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${task.progress}%` }} />
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

/* ───── Tabs ───── */

function RequestsTab({ projectId }: { projectId: string }) {
  const items = requests.filter((r) => r.projectId === projectId);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.length === 0 && <EmptyState icon={Inbox} label="No requests for this project yet" />}
      {items.map((r) => (
        <div key={r.id} className="panel p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_META[r.status].cls}`}>
              {REQUEST_STATUS_META[r.status].label}
            </span>
            <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
          </div>
          <div className="text-sm font-semibold">{r.title}</div>
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{r.description}</p>
        </div>
      ))}
    </div>
  );
}

function DeliverablesTab({ projectId }: { projectId: string }) {
  const items = deliverables.filter((d) => d.projectId === projectId);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.length === 0 && <EmptyState icon={PackageCheck} label="No deliverables yet" />}
      {items.map((d) => (
        <div key={d.id} className="panel overflow-hidden">
          <div className={`h-32 bg-gradient-to-br ${d.thumbnail}`} />
          <div className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DELIVERABLE_STATUS_META[d.status].cls}`}>
                {DELIVERABLE_STATUS_META[d.status].label}
              </span>
              <span className="text-[11px] text-muted-foreground">{d.version} · {d.updatedAt}</span>
            </div>
            <div className="text-sm font-semibold">{d.title}</div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{d.fileCount} files</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{d.feedback} comments</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ projectId }: { projectId: string }) {
  const docs = documents.filter((d) => d.projectId === projectId);
  const folders = Array.from(new Set(docs.map((d) => d.folder)));
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="panel p-4 lg:col-span-1">
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Folders</div>
        <div className="space-y-1 text-sm">
          {folders.map((f) => (
            <div key={f} className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-muted">
              <span className="inline-flex items-center gap-2"><FolderOpen className="h-4 w-4 text-muted-foreground" /> {f}</span>
              <span className="text-[11px] text-muted-foreground">{docs.filter((d) => d.folder === f).length}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-2 lg:col-span-3">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Folder</th>
              <th className="px-3 py-3 font-medium">Size</th>
              <th className="px-3 py-3 font-medium">Uploaded</th>
              <th className="px-3 py-3 font-medium">Visibility</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const u = users.find((x) => x.id === d.uploadedBy)!;
              return (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3 font-medium">{d.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.folder}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.size}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.name.split(" ")[0]} · {d.uploadedAt}</td>
                  <td className="px-3 py-3">
                    {d.shared ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Eye className="h-3 w-3" /> Client</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Internal</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Download className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessagesTab({ projectId }: { projectId: string }) {
  const channel = channels.find((c) => c.projectId === projectId) ?? channels[0];
  const msgs = messages.filter((m) => m.channelId === channel.id);
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <div className="text-sm font-semibold">#{channel.name}</div>
        <div className="text-xs text-muted-foreground">Conversation thread · mixed internal &amp; client</div>
      </div>
      <div className="max-h-[480px] space-y-4 overflow-y-auto p-6">
        {msgs.map((m) => {
          const u = users.find((x) => x.id === m.author)!;
          const internal = m.visibility === "internal";
          return (
            <div key={m.id} className="flex gap-3">
              <UserAvatar user={u} size={32} />
              <div className={cn("flex-1 rounded-2xl px-4 py-3", internal ? "bg-amber-50 border border-amber-200/60" : "bg-muted")}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold">{u.name}</span>
                  <span className="text-muted-foreground">{m.createdAt}</span>
                  {internal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      <Lock className="h-2.5 w-2.5" /> Internal only
                    </span>
                  )}
                </div>
                <div className="text-sm">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-4">
        <div className="rounded-2xl border border-border bg-background p-3">
          <textarea rows={2} placeholder="Reply to thread…" className="w-full resize-none bg-transparent text-sm focus:outline-none" />
          <div className="mt-2 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--color-primary)]" /> Internal only
            </label>
            <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeTab({ projectId }: { projectId: string }) {
  const entries = timeEntries.filter((t) => t.projectId === projectId).slice(0, 20);
  const project = projects.find((p) => p.id === projectId)!;
  const logged = entries.reduce((s, t) => s + t.hours, 0);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 panel p-2">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Member</th>
              <th className="px-3 py-3 font-medium">Note</th>
              <th className="px-3 py-3 font-medium">Hours</th>
              <th className="px-3 py-3 font-medium">Billable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const u = users.find((x) => x.id === e.userId)!;
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2"><UserAvatar user={u} size={20} /> {u.name.split(" ")[0]}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{e.note}</td>
                  <td className="px-3 py-3 font-medium">{e.hours}h</td>
                  <td className="px-3 py-3">{e.billable ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Billable</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-6">
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Logged this view</div>
          <div className="mt-1 text-3xl font-semibold">{logged.toFixed(1)}h</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${(project.hoursLogged / project.hoursEstimate) * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {project.hoursLogged}h logged of {project.hoursEstimate}h estimate
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Budget</div>
          <div className="mt-1 text-3xl font-semibold">${(project.spent / 1000).toFixed(0)}k</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500" style={{ width: `${(project.spent / project.budget) * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            of ${(project.budget / 1000).toFixed(0)}k budget
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: typeof Inbox; label: string }) {
  return (
    <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">Use the buttons above to get started.</div>
    </div>
  );
}
