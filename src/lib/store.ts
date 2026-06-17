/**
 * Reactive in-memory store for the MGL Client Platform.
 *
 * Wraps the seed data from mock-data.ts in a Zustand store so modals,
 * filters, and pages can read and mutate the same source of truth.
 */
import { create } from "zustand";
import {
  clients as seedClients,
  projects as seedProjects,
  tasks as seedTasks,
  requests as seedRequests,
  deliverables as seedDeliverables,
  documents as seedDocuments,
  channels as seedChannels,
  messages as seedMessages,
  timeEntries as seedTime,
  users as seedUsers,
  type Client,
  type Project,
  type ProjectStatus,
  type Task,
  type TaskStage,
  type Priority,
  type ClientRequest,
  type RequestStatus,
  type RequestType,
  type Deliverable,
  type DeliverableStatus,
  type Document,
  type TimeEntry,
  type User,
  type Comment,
} from "./mock-data";

export type AIActionLog = {
  id: string;
  iconKey: "task" | "project" | "summary" | "draft" | "time" | "move";
  title: string;
  meta: string;
  ts: string;
};

export type StorageConnection = {
  provider: "gdrive" | "dropbox" | "onedrive" | "box";
  connected: boolean;
  connectedAt?: string;
  email?: string;
};

type State = {
  users: User[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  requests: ClientRequest[];
  deliverables: Deliverable[];
  documents: Document[];
  channels: typeof seedChannels;
  messages: typeof seedMessages;
  timeEntries: TimeEntry[];
  aiActions: AIActionLog[];
  comments: Comment[];
  storageConnections: StorageConnection[];

  /* Clients */
  createClient: (input: Partial<Client> & Pick<Client, "name" | "industry" | "contact" | "contactEmail">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  archiveClient: (id: string) => void;

  /* Projects */
  createProject: (input: Partial<Project> & Pick<Project, "name" | "clientId">) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;

  /* Tasks */
  createTask: (input: Partial<Task> & Pick<Task, "projectId" | "title">) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setTaskStage: (id: string, stage: TaskStage) => void;
  setTaskPriority: (id: string, priority: Priority) => void;
  assignTask: (id: string, assignees: string[]) => void;

  /* Requests */
  createRequest: (input: Partial<ClientRequest> & Pick<ClientRequest, "clientId" | "title" | "type">) => ClientRequest;
  updateRequest: (id: string, patch: Partial<ClientRequest>) => void;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  convertRequestToTask: (id: string, projectId: string) => Task | null;
  convertRequestToProject: (id: string, projectInput: Partial<Project>) => Project | null;

  /* Deliverables */
  createDeliverable: (input: Partial<Deliverable> & Pick<Deliverable, "projectId" | "title">) => Deliverable;
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  setDeliverableStatus: (id: string, status: DeliverableStatus) => void;

  /* Documents */
  createFolder: (projectId: string, name: string) => void;
  renameFolder: (projectId: string, oldName: string, newName: string) => void;
  uploadDocument: (input: Partial<Document> & Pick<Document, "projectId" | "name" | "folder">) => Document;
  moveDocument: (id: string, folder: string) => void;
  deleteDocument: (id: string) => void;

  /* Team */
  addTeamMember: (input: Partial<User> & Pick<User, "name" | "email" | "title">) => User;
  updateTeamMember: (id: string, patch: Partial<User>) => void;
  removeTeamMember: (id: string) => void;

  /* Time */
  logTime: (input: Partial<TimeEntry> & Pick<TimeEntry, "userId" | "projectId" | "hours" | "date">) => TimeEntry;
  updateTimeEntry: (id: string, patch: Partial<TimeEntry>) => void;

  /* Comments */
  createComment: (input: Partial<Comment> & Pick<Comment, "threadId" | "author" | "body" | "visibility">) => Comment;

  /* Storage Connections */
  connectStorage: (provider: "gdrive" | "dropbox" | "onedrive" | "box", email: string) => void;
  disconnectStorage: (provider: "gdrive" | "dropbox" | "onedrive" | "box") => void;

  /* AI */
  logAIAction: (a: Omit<AIActionLog, "id" | "ts">) => void;
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
const today = () => new Date().toISOString().slice(0, 10);

const seedComments: Comment[] = [
  // Project-level comments for Project 1 (NovaBoard Mobile, p1)
  { id: "cm1", threadId: "p1", author: "u8", body: "Just reviewed the onboarding v3 — feels really clean. One small ask: can we slow the transition between step 2 and 3?", createdAt: "Today · 10:42", visibility: "client" },
  { id: "cm2", threadId: "p1", author: "u2", body: "Great call — easing it now. Will repost as v3.1 by EOD.", createdAt: "Today · 10:51", visibility: "client" },
  { id: "cm3", threadId: "p1", author: "u3", body: "Internal note: I'll wire the new transition curve to the design token so we don't drift from web.", createdAt: "Today · 10:57", visibility: "internal" },
  { id: "cm4", threadId: "p1", author: "u2", body: "Perfect. Marking the onboarding deliverable as ready for re-review.", createdAt: "Today · 11:14", visibility: "client" },
  { id: "cm5", threadId: "p1", author: "u8", body: "Thanks team 🙏", createdAt: "Today · 11:22", visibility: "client" },

  // Task-level comments for Project 1, Task 1 (p1-t1: Design Notification Banner)
  { id: "cm-t1-1", threadId: "p1-t1", author: "u2", body: "Should we use warning orange or warning red for the alert state?", createdAt: "Yesterday · 09:30", visibility: "client" },
  { id: "cm-t1-2", threadId: "p1-t1", author: "u1", body: "Let's stick to the amber-500 from our brand system for warnings, and rose-500 only for critical errors.", createdAt: "Yesterday · 10:15", visibility: "client" },

  // Task-level comments for Project 1, Task 5 (p1-t5: Create Dashboard Wireframe)
  { id: "cm-t5-1", threadId: "p1-t5", author: "u8", body: "Can we see the layout with the sidebar collapsed as well?", createdAt: "2 days ago", visibility: "client" },
  { id: "cm-t5-2", threadId: "p1-t5", author: "u2", body: "Absolutely. I'll add a view showing the collapsed sidebar state. It will free up about 180px of horizontal space.", createdAt: "Yesterday · 14:00", visibility: "client" },
  { id: "cm-t5-3", threadId: "p1-t5", author: "u4", body: "Designed some new icon variants for the collapsed view. They're in the brand kit.", createdAt: "Yesterday · 16:30", visibility: "internal" },
];

export const useStore = create<State>((set, get) => ({
  users: [...seedUsers],
  clients: [...seedClients],
  projects: [...seedProjects],
  tasks: [...seedTasks],
  requests: [...seedRequests],
  deliverables: [...seedDeliverables],
  documents: [...seedDocuments],
  channels: [...seedChannels],
  messages: [...seedMessages],
  timeEntries: [...seedTime],
  aiActions: [
    { id: "a1", iconKey: "task", title: "Created task: Soften hero gradient", meta: "NovaBoard Mobile · assigned to Mia", ts: "12m ago" },
    { id: "a2", iconKey: "move", title: "Moved 2 tasks to In Review", meta: "Auto-detected from comment thread", ts: "1h ago" },
    { id: "a3", iconKey: "draft", title: "Drafted client reply to Elena", meta: "Northwind Brand · awaiting your review", ts: "2h ago" },
    { id: "a4", iconKey: "summary", title: "Summarized 4 requests from Lumen", meta: "Highlighted 1 needing clarification", ts: "Yesterday" },
  ],
  comments: [...seedComments],
  storageConnections: [
    { provider: "gdrive", connected: false },
    { provider: "dropbox", connected: false },
    { provider: "onedrive", connected: false },
    { provider: "box", connected: false },
  ],

  /* Clients */
  createClient: (input) => {
    const c: Client = {
      id: uid("c"),
      name: input.name,
      industry: input.industry,
      contact: input.contact,
      contactEmail: input.contactEmail,
      logoColor: input.logoColor ?? "#0049FE",
      status: input.status ?? "active",
      retainer: input.retainer ?? "Project",
      since: input.since ?? new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      projects: 0,
      openRequests: 0,
      hoursMonth: 0,
      health: input.health ?? "healthy",
    };
    set((s) => ({ clients: [c, ...s.clients] }));
    return c;
  },
  updateClient: (id, patch) =>
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  archiveClient: (id) =>
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, status: "archived" } : c)) })),

  /* Projects */
  createProject: (input) => {
    const p: Project = {
      id: uid("p"),
      name: input.name,
      clientId: input.clientId,
      status: input.status ?? "planning",
      type: input.type ?? "fixed",
      budget: input.budget ?? 0,
      spent: 0,
      hoursEstimate: input.hoursEstimate ?? 0,
      hoursLogged: 0,
      startDate: input.startDate ?? new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      endDate: input.endDate ?? "—",
      progress: 0,
      team: input.team ?? [],
      lead: input.lead ?? (input.team?.[0] ?? "u1"),
      description: input.description ?? "",
      accent: input.accent ?? "progress",
    };
    set((s) => ({ projects: [p, ...s.projects] }));
    return p;
  },
  updateProject: (id, patch) =>
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  archiveProject: (id) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: "on_hold" } : p)),
    })),
  setProjectStatus: (id, status) =>
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)) })),

  /* Tasks */
  createTask: (input) => {
    const t: Task = {
      id: uid("t"),
      projectId: input.projectId,
      title: input.title,
      note: input.note ?? "",
      stage: input.stage ?? "todo",
      priority: input.priority ?? "medium",
      progress: input.progress ?? 0,
      dueDate: input.dueDate ?? "",
      assignees: input.assignees ?? [],
      attachments: 0,
      comments: 0,
    };
    set((s) => ({ tasks: [t, ...s.tasks] }));
    return t;
  },
  updateTask: (id, patch) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  setTaskStage: (id, stage) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, stage, progress: stage === "completed" ? 100 : t.progress } : t,
      ),
    })),
  setTaskPriority: (id, priority) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)) })),
  assignTask: (id, assignees) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, assignees } : t)) })),

  /* Requests */
  createRequest: (input) => {
    const r: ClientRequest = {
      id: uid("r"),
      clientId: input.clientId,
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "submitted",
      submittedAt: "Just now",
      submittedBy: input.submittedBy ?? "u1",
      estimatedHours: input.estimatedHours,
      priority: input.priority ?? "medium",
    };
    set((s) => ({ requests: [r, ...s.requests] }));
    return r;
  },
  updateRequest: (id, patch) =>
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  setRequestStatus: (id, status) =>
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),
  convertRequestToTask: (id, projectId) => {
    const r = get().requests.find((x) => x.id === id);
    if (!r) return null;
    const task = get().createTask({ projectId, title: r.title, note: r.description, priority: r.priority });
    get().setRequestStatus(id, "converted_task");
    return task;
  },
  convertRequestToProject: (id, projectInput) => {
    const r = get().requests.find((x) => x.id === id);
    if (!r) return null;
    const project = get().createProject({
      name: projectInput.name ?? r.title,
      clientId: r.clientId,
      description: projectInput.description ?? r.description,
      type: projectInput.type ?? "fixed",
      budget: projectInput.budget ?? 0,
      hoursEstimate: projectInput.hoursEstimate ?? 40,
      team: projectInput.team ?? [],
    });
    get().setRequestStatus(id, "converted_project");
    return project;
  },

  /* Deliverables */
  createDeliverable: (input) => {
    const d: Deliverable = {
      id: uid("d"),
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? "",
      version: input.version ?? "v1",
      status: input.status ?? "internal_review",
      updatedAt: "Just now",
      thumbnail: input.thumbnail ?? "from-[oklch(0.94_0.04_230)] to-[oklch(0.93_0.045_295)]",
      fileCount: input.fileCount ?? 1,
      feedback: 0,
    };
    set((s) => ({ deliverables: [d, ...s.deliverables] }));
    return d;
  },
  updateDeliverable: (id, patch) =>
    set((s) => ({ deliverables: s.deliverables.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  setDeliverableStatus: (id, status) =>
    set((s) => ({ deliverables: s.deliverables.map((d) => (d.id === id ? { ...d, status } : d)) })),

  /* Documents */
  createFolder: (projectId, name) => {
    // Folders are derived from documents — we add a hidden placeholder doc to materialize an empty folder.
    set((s) => ({
      documents: [
        ...s.documents,
        {
          id: uid("doc"),
          projectId,
          folder: name,
          name: ".keep",
          size: "0 KB",
          uploadedBy: "u1",
          uploadedAt: "Just now",
          shared: false,
        },
      ],
    }));
  },
  renameFolder: (projectId, oldName, newName) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.projectId === projectId && d.folder === oldName ? { ...d, folder: newName } : d,
      ),
    })),
  uploadDocument: (input) => {
    const d: Document = {
      id: uid("doc"),
      projectId: input.projectId,
      name: input.name,
      folder: input.folder,
      size: input.size ?? `${Math.floor(Math.random() * 8 + 1)}.${Math.floor(Math.random() * 9)} MB`,
      uploadedBy: input.uploadedBy ?? "u1",
      uploadedAt: "Just now",
      shared: input.shared ?? false,
    };
    set((s) => ({ documents: [d, ...s.documents] }));
    return d;
  },
  moveDocument: (id, folder) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, folder } : d)) })),
  deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

  /* Team */
  addTeamMember: (input) => {
    const palette = ["#0049FE", "#FF7A59", "#10B981", "#A855F7", "#F59E0B", "#EC4899"];
    const u: User = {
      id: uid("u"),
      name: input.name,
      email: input.email,
      title: input.title,
      role: input.role ?? "team",
      color: input.color ?? palette[Math.floor(Math.random() * palette.length)],
      avatar: input.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    };
    set((s) => ({ users: [...s.users, u] }));
    return u;
  },
  updateTeamMember: (id, patch) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
  removeTeamMember: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

  /* Time */
  logTime: (input) => {
    const te: TimeEntry = {
      id: uid("te"),
      userId: input.userId,
      projectId: input.projectId,
      taskId: input.taskId,
      date: input.date ?? today(),
      hours: input.hours,
      note: input.note ?? "",
      billable: input.billable ?? true,
    };
    set((s) => ({ timeEntries: [te, ...s.timeEntries] }));
    return te;
  },
  updateTimeEntry: (id, patch) =>
    set((s) => ({ timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

  /* Comments */
  createComment: (input) => {
    const c: Comment = {
      id: uid("cm"),
      threadId: input.threadId,
      author: input.author,
      body: input.body,
      createdAt: "Just now",
      visibility: input.visibility ?? "client",
      attachments: input.attachments ?? [],
    };
    set((s) => {
      // Also update comment count on the task if threadId represents a task
      const updatedTasks = s.tasks.map((t) => {
        if (t.id === input.threadId) {
          return { ...t, comments: (t.comments || 0) + 1 };
        }
        return t;
      });
      return {
        comments: [...s.comments, c],
        tasks: updatedTasks,
      };
    });
    return c;
  },

  /* Storage Connections */
  connectStorage: (provider, email) => {
    set((s) => ({
      storageConnections: s.storageConnections.map((conn) =>
        conn.provider === provider
          ? { ...conn, connected: true, email, connectedAt: today() }
          : conn
      ),
    }));
  },
  disconnectStorage: (provider) => {
    set((s) => ({
      storageConnections: s.storageConnections.map((conn) =>
        conn.provider === provider
          ? { ...conn, connected: false, email: undefined, connectedAt: undefined }
          : conn
      ),
    }));
  },

  /* AI */
  logAIAction: (a) =>
    set((s) => ({
      aiActions: [{ id: uid("ai"), ts: "Just now", ...a }, ...s.aiActions].slice(0, 50),
    })),
}));

/* ────────────────────── Derived helpers ────────────────────── */

export function getProjectProgress(projectId: string) {
  const s = useStore.getState();
  const t = s.tasks.filter((x) => x.projectId === projectId);
  const completed = t.filter((x) => x.stage === "completed").length;
  const d = s.deliverables.filter((x) => x.projectId === projectId);
  const dApproved = d.filter((x) => x.status === "approved").length;
  const project = s.projects.find((p) => p.id === projectId);
  return {
    tasksTotal: t.length,
    tasksCompleted: completed,
    deliverablesTotal: d.length,
    deliverablesCompleted: dApproved,
    pctTasks: t.length ? Math.round((completed / t.length) * 100) : 0,
    pctOverall: project?.progress ?? 0,
    hoursLogged: project?.hoursLogged ?? 0,
    hoursEstimate: project?.hoursEstimate ?? 0,
    budgetSpent: project?.spent ?? 0,
    budget: project?.budget ?? 0,
    health:
      !project
        ? "healthy"
        : project.spent / Math.max(1, project.budget) > 0.9
          ? "at-risk"
          : project.hoursLogged / Math.max(1, project.hoursEstimate) > 0.85
            ? "watch"
            : "healthy",
  } as const;
}
