/**
 * Reactive in-memory store for the MGL Portal.
 *
 * Wraps the seed data from mock-data.ts in a Zustand store so modals,
 * filters, and pages can read and mutate the same source of truth.
 */
import { create } from "zustand";
import { useMemo } from "react";
import {
  type Client,
  type Project,
  type ProjectStatus,
  type Task,
  type TaskStage,
  type Priority,
  type ClientRequest,
  type RequestStatus,
  type RequestType,
  type Document,
  type TimeEntry,
  type User,
  type Comment,
  type Channel,
  type Message,
} from "./mock-data";
import {
  listClients,
  createClientRecord,
  updateClientRecord,
  archiveClientRecord,
  deleteClientRecord,
  inviteClientContactRecord,
} from "./data/clients";
import {
  listProjects,
  createProjectRecord,
  updateProjectRecord,
  archiveProjectRecord,
  deleteProjectRecord,
  setProjectStatusRecord,
  duplicateProjectRecord,
} from "./data/projects";
import { listProfiles, inviteTeamMember, updateProfileRecord, deleteProfileRecord, resendTeamInviteRecord } from "./data/profiles";
import {
  listTasks,
  createTaskRecord,
  updateTaskRecord,
  deleteTaskRecord,
  setTaskStageRecord,
  setTaskPriorityRecord,
  assignTaskRecord,
} from "./data/tasks";
import {
  listRequests,
  createRequestRecord,
  updateRequestRecord,
  setRequestStatusRecord,
  deleteRequestRecord,
} from "./data/requests";
import {
  listDocuments,
  uploadDocumentRecord,
  renameDocumentRecord,
  moveDocumentRecord,
  deleteDocumentRecord,
  setDocumentSharedRecord,
  createFolderRecord,
  renameFolderRecord,
  deleteFolderRecord,
} from "./data/documents";
import {
  listTimeEntries,
  logTimeRecord,
  updateTimeEntryRecord,
  deleteTimeEntryRecord,
} from "./data/time-entries";
import { listComments, createCommentRecord, type ThreadType } from "./data/comments";
import { listChannels } from "./data/channels";

// clients, projects, team, tasks, requests, documents, time entries, and
// comments are now backed by Supabase (see src/lib/data/); channels are
// hydrated from Supabase too (read-only — see data/channels.ts for why).
// messages, storage connections, and the AI log have no Supabase-backed data
// layer yet — none of them are read by any page (verified: no component
// subscribes to state.messages), so they're left as an empty/static
// placeholder rather than migrated for their own sake.

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

export type ProjectStorageMapping = {
  id: string;
  projectId: string;
  provider: "gdrive" | "dropbox" | "onedrive" | "box";
  email: string;
  folderName: string;
  connectedAt: string;
};

type State = {
  users: User[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  requests: ClientRequest[];
  documents: Document[];
  channels: Channel[];
  messages: Message[];
  timeEntries: TimeEntry[];
  aiActions: AIActionLog[];
  comments: Comment[];
  storageConnections: StorageConnection[];
  projectStorageMappings: ProjectStorageMapping[];
  workspaceName: string;
  updateWorkspaceName: (name: string) => void;

  /* Hydration — clients/projects load from Supabase; call once on app mount
     (see Providers) after a session exists. RLS decides what comes back. */
  hydrated: boolean;
  hydrating: boolean;
  hydrate: () => Promise<void>;

  /* Clients — backed by Supabase (src/lib/data/clients.ts). createClient also
     invites the primary contact via magic link (best-effort — see impl). */
  createClient: (input: Partial<Client> & Pick<Client, "name" | "industry" | "contact" | "contactEmail">) => Promise<Client>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  /** Resends the portal sign-in link to a client's contact (e.g. their first invite expired). */
  resendClientInvite: (clientId: string) => Promise<void>;
  /** Invites an additional contact at a client company to their own portal login (separate profile, same client_id). */
  inviteClientContact: (clientId: string, name: string, email: string) => Promise<void>;

  /* Projects — backed by Supabase (src/lib/data/projects.ts) */
  createProject: (input: Partial<Project> & Pick<Project, "name" | "clientId">) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  setProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;

  /* Tasks — backed by Supabase (src/lib/data/tasks.ts) */
  createTask: (input: Partial<Task> & Pick<Task, "projectId" | "title">) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStage: (id: string, stage: TaskStage) => Promise<void>;
  setTaskPriority: (id: string, priority: Priority) => Promise<void>;
  assignTask: (id: string, assignees: string[]) => Promise<void>;

  /* Requests — backed by Supabase (src/lib/data/requests.ts) */
  createRequest: (input: Partial<ClientRequest> & Pick<ClientRequest, "clientId" | "title" | "type">) => Promise<ClientRequest>;
  updateRequest: (id: string, patch: Partial<ClientRequest>) => Promise<void>;
  setRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  // Async now — it calls the Supabase-backed createTask().
  convertRequestToTask: (id: string, projectId: string, taskInput?: Partial<Task>) => Promise<Task | null>;
  // Async now — it calls the Supabase-backed createProject().
  convertRequestToProject: (id: string, projectInput: Partial<Project>) => Promise<Project | null>;

  /* Documents — backed by Supabase (src/lib/data/documents.ts). Folders are
     derived: they're just the distinct `folder` values on documents. */
  createFolder: (projectId: string, name: string) => Promise<void>;
  renameFolder: (projectId: string | undefined, oldName: string, newName: string) => Promise<void>;
  deleteFolder: (projectId: string | undefined, folderName: string) => Promise<void>;
  renameDocument: (id: string, name: string) => Promise<void>;
  uploadDocument: (input: Partial<Document> & Pick<Document, "projectId" | "name" | "folder">, file?: File) => Promise<Document>;
  moveDocument: (id: string, folder: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  toggleDocumentShared: (id: string) => Promise<void>;

  /* Team — backed by Supabase (src/lib/data/profiles.ts). addTeamMember
     invites via magic link rather than inserting directly — see that file's
     header for why (profiles.id is an auth.users FK; the browser only ever
     holds the anon key). */
  addTeamMember: (input: Partial<User> & Pick<User, "name" | "email" | "title">) => Promise<User>;
  updateTeamMember: (id: string, patch: Partial<User>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  /** Resends the portal sign-in link to a team/manager member (e.g. their first invite expired). */
  resendTeamInvite: (id: string) => Promise<void>;

  /* Time — backed by Supabase (src/lib/data/time-entries.ts) */
  logTime: (input: Partial<TimeEntry> & Pick<TimeEntry, "userId" | "projectId" | "hours" | "date">) => Promise<TimeEntry>;
  updateTimeEntry: (id: string, patch: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  /* Comments — backed by Supabase (src/lib/data/comments.ts). threadId can
     point at a project, task, or request; the DB needs to know which, so
     this resolves it by checking the store's own tasks/requests/projects. */
  createComment: (input: Partial<Comment> & Pick<Comment, "threadId" | "author" | "body" | "visibility">) => Promise<Comment>;

  /* Channels — hydrated from Supabase (read-only, see data/channels.ts) */
  markChannelAsRead: (channelId: string) => void;

  /* Storage Connections */
  connectStorage: (provider: "gdrive" | "dropbox" | "onedrive" | "box", email: string) => void;
  disconnectStorage: (provider: "gdrive" | "dropbox" | "onedrive" | "box") => void;
  mapProjectStorage: (projectId: string, provider: "gdrive" | "dropbox" | "onedrive" | "box", email: string, folderName: string) => void;
  unmapProjectStorage: (id: string) => void;

  /* AI */
  logAIAction: (a: Omit<AIActionLog, "id" | "ts">) => void;
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
const today = () => new Date().toISOString().slice(0, 10);

// Exported so scripts/seed.ts can reuse the same demo comment thread
// instead of re-transcribing it.
export const seedComments: Comment[] = [
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

  // Request-level comments for Request 1 (r1: Soften hero gradient)
  { id: "cm-r1-1", threadId: "r1", author: "u8", body: "We should probably check how the gradient works on older Android devices.", createdAt: "Yesterday · 11:30", visibility: "client" },
  { id: "cm-r1-2", threadId: "r1", author: "u1", body: "Good idea, I'll test it on my Samsung A50 test device and confirm.", createdAt: "Yesterday · 12:45", visibility: "client" },
];

export const useStore = create<State>((set, get) => ({
  // Empty until hydrate() resolves — see Providers, which calls it once a
  // Supabase session exists. Deliberately not seeded with mock data: showing
  // fake numbers that then swap to different real ones is worse than a
  // brief empty state.
  users: [],
  clients: [],
  projects: [],
  tasks: [],
  requests: [],
  hydrated: false,
  hydrating: false,
  hydrate: async () => {
    if (get().hydrating || get().hydrated) return;
    set({ hydrating: true });
    try {
      const [users, clients, projects, tasks, requests, documents, timeEntries, comments, channels] = await Promise.all([
        listProfiles(),
        listClients(),
        listProjects(),
        listTasks(),
        listRequests(),
        listDocuments(),
        listTimeEntries(),
        listComments(),
        listChannels(),
      ]);
      set({ users, clients, projects, tasks, requests, documents, timeEntries, comments, channels, hydrated: true });
    } catch (e) {
      console.error("Failed to load portal data from Supabase", e);
    } finally {
      set({ hydrating: false });
    }
  },
  documents: [],
  channels: [],
  messages: [],
  timeEntries: [],
  aiActions: [
    { id: "a1", iconKey: "task", title: "Created task: Soften hero gradient", meta: "NovaBoard Mobile · assigned to Mia", ts: "12m ago" },
    { id: "a2", iconKey: "move", title: "Moved 2 tasks to In Review", meta: "Auto-detected from comment thread", ts: "1h ago" },
    { id: "a3", iconKey: "draft", title: "Drafted client reply to Elena", meta: "Northwind Brand · awaiting your review", ts: "2h ago" },
    { id: "a4", iconKey: "summary", title: "Summarized 4 requests from Lumen", meta: "Highlighted 1 needing clarification", ts: "Yesterday" },
  ],
  comments: [],
  storageConnections: [
    { provider: "gdrive", connected: false },
    { provider: "dropbox", connected: false },
    { provider: "onedrive", connected: false },
    { provider: "box", connected: false },
  ],
  projectStorageMappings: [
    { id: "psm-1", projectId: "p1", provider: "gdrive", email: "marketing-ops@mgl-portal.com", folderName: "Marketing Assets", connectedAt: "Yesterday · 10:15 AM" }
  ],
  workspaceName: "MGL Agency",

  /* Clients — each call hits Supabase first (so RLS + validation run for
     real) and only updates local state once that succeeds. Errors propagate
     to the caller — every call site in modals/index.tsx already wraps these
     in useAsyncAction()'s run(), which shows an error toast on rejection. */
  createClient: async (input) => {
    const c = await createClientRecord(input);
    set((s) => ({ clients: [c, ...s.clients] }));
    // Best-effort: the client company record above is the source of truth,
    // so a flaky invite email (rate limit, bad address, etc.) shouldn't make
    // client creation itself look like it failed. If this fails, the owner
    // can resend from the client's page — see resendClientInvite.
    try {
      await inviteClientContactRecord(c.id, c.contact, c.contactEmail);
    } catch (e) {
      console.error(`Failed to invite ${c.contactEmail} to the client portal`, e);
    }
    return c;
  },
  resendClientInvite: async (clientId) => {
    const c = get().clients.find((c) => c.id === clientId);
    if (!c) throw new Error("Client not found");
    await inviteClientContactRecord(c.id, c.contact, c.contactEmail);
  },
  inviteClientContact: async (clientId, name, email) => {
    await inviteClientContactRecord(clientId, name, email);
  },
  updateClient: async (id, patch) => {
    await updateClientRecord(id, patch);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  },
  archiveClient: async (id) => {
    await archiveClientRecord(id);
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, status: "archived" } : c)) }));
  },
  deleteClient: async (id) => {
    await deleteClientRecord(id);
    // Postgres cascades the client's projects/requests on delete; requests
    // are still mock-only locally so we drop them from local state too.
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      projects: s.projects.filter((p) => p.clientId !== id),
      requests: s.requests.filter((r) => r.clientId !== id),
    }));
  },

  /* Projects — same pattern as Clients above. */
  createProject: async (input) => {
    const p = await createProjectRecord(input);
    set((s) => ({ projects: [p, ...s.projects] }));
    return p;
  },
  updateProject: async (id, patch) => {
    await updateProjectRecord(id, patch);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    }));
  },
  archiveProject: async (id) => {
    await archiveProjectRecord(id);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status: "on_hold", updatedAt: new Date().toISOString() } : p)),
    }));
  },
  deleteProject: async (id) => {
    await deleteProjectRecord(id);
    // Postgres cascades tasks/documents on delete; both are still mock-only
    // locally so we drop them from local state too.
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      documents: s.documents.filter((doc) => doc.projectId !== id),
    }));
  },
  duplicateProject: async (id) => {
    const newProj = await duplicateProjectRecord(id);
    set((s) => ({ projects: [newProj, ...s.projects] }));

    // Recreate each task for real against the new project — tasks are
    // Supabase-backed now too, so this can't just splice copies into local
    // state the way it used to.
    const originalTasks = get().tasks.filter((t) => t.projectId === id);
    await Promise.all(
      originalTasks.map((t) =>
        get().createTask({
          projectId: newProj.id,
          title: t.title,
          note: t.note,
          stage: t.stage,
          priority: t.priority,
          progress: t.progress,
          dueDate: t.dueDate,
          assignees: t.assignees,
          startDate: t.startDate,
          tags: t.tags,
          followers: t.followers,
          estimatedHours: t.estimatedHours,
          customFields: t.customFields,
        })
      )
    );

    return newProj;
  },
  setProjectStatus: async (id, status) => {
    await setProjectStatusRecord(id, status);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
    }));
  },

  /* Tasks — backed by Supabase (src/lib/data/tasks.ts) */
  createTask: async (input) => {
    const t = await createTaskRecord(input);
    set((s) => ({ tasks: [t, ...s.tasks] }));
    return t;
  },
  updateTask: async (id, patch) => {
    await updateTaskRecord(id, patch);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
    }));
  },
  deleteTask: async (id) => {
    await deleteTaskRecord(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  setTaskStage: async (id, stage) => {
    const progress = stage === "completed" ? 100 : undefined;
    await setTaskStageRecord(id, stage, progress);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, stage, progress: progress ?? t.progress } : t)),
    }));
  },
  setTaskPriority: async (id, priority) => {
    await setTaskPriorityRecord(id, priority);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)) }));
  },
  assignTask: async (id, assignees) => {
    await assignTaskRecord(id, assignees);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, assignees } : t)) }));
  },

  /* Requests — backed by Supabase (src/lib/data/requests.ts) */
  createRequest: async (input) => {
    const r = await createRequestRecord({
      ...input,
      submittedBy: input.submittedBy ?? get().users.find((u) => u.role === "owner")?.id ?? get().users[0]?.id,
    });
    set((s) => ({ requests: [r, ...s.requests] }));
    return r;
  },
  updateRequest: async (id, patch) => {
    await updateRequestRecord(id, patch);
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  setRequestStatus: async (id, status) => {
    await setRequestStatusRecord(id, status);
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }));
  },
  deleteRequest: async (id) => {
    await deleteRequestRecord(id);
    set((s) => ({
      requests: s.requests.filter((r) => r.id !== id),
      comments: s.comments.filter((c) => c.threadId !== id),
    }));
  },
  convertRequestToTask: async (id, projectId, taskInput) => {
    const r = get().requests.find((x) => x.id === id);
    if (!r) return null;
    const task = await get().createTask({
      projectId,
      title: r.title,
      note: r.description,
      priority: r.priority,
      ...taskInput,
    });
    await get().setRequestStatus(id, "convert");
    return task;
  },
  convertRequestToProject: async (id, projectInput) => {
    const r = get().requests.find((x) => x.id === id);
    if (!r) return null;
    const project = await get().createProject({
      name: projectInput.name ?? r.title,
      clientId: r.clientId,
      description: projectInput.description ?? r.description,
      type: projectInput.type ?? "fixed",
      budget: projectInput.budget ?? 0,
      hoursEstimate: projectInput.hoursEstimate ?? 40,
      team: projectInput.team ?? [],
    });
    await get().setRequestStatus(id, "convert");
    return project;
  },



  /* Documents — backed by Supabase (src/lib/data/documents.ts) */
  createFolder: async (projectId, name) => {
    // Folders are derived from documents — we add a hidden placeholder doc to materialize an empty folder.
    const d = await createFolderRecord(projectId, name);
    set((s) => ({ documents: [...s.documents, d] }));
  },
  renameFolder: async (projectId, oldName, newName) => {
    await renameFolderRecord(projectId, oldName, newName);
    set((s) => ({
      documents: s.documents.map((d) =>
        (!projectId || d.projectId === projectId) && d.folder === oldName ? { ...d, folder: newName } : d,
      ),
    }));
  },
  deleteFolder: async (projectId, folderName) => {
    await deleteFolderRecord(projectId, folderName);
    set((s) => ({
      documents: s.documents.filter((d) => !((!projectId || d.projectId === projectId) && d.folder === folderName)),
      projectStorageMappings: s.projectStorageMappings.filter((m) => !((!projectId || m.projectId === projectId) && m.folderName === folderName)),
    }));
  },
  renameDocument: async (id, name) => {
    await renameDocumentRecord(id, name);
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, name } : d)),
    }));
  },
  uploadDocument: async (input, file) => {
    const d = await uploadDocumentRecord(input, file);
    set((s) => ({ documents: [d, ...s.documents] }));
    return d;
  },
  moveDocument: async (id, folder) => {
    await moveDocumentRecord(id, folder);
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, folder } : d)) }));
  },
  deleteDocument: async (id) => {
    await deleteDocumentRecord(id);
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
  },
  toggleDocumentShared: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    await setDocumentSharedRecord(id, !doc.shared);
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, shared: !d.shared } : d)),
    }));
  },

  /* Team — invites rather than inserts; see profiles.ts header. */
  addTeamMember: async (input) => {
    const palette = ["#0049FE", "#FF7A59", "#10B981", "#A855F7", "#F59E0B", "#EC4899"];
    const u = await inviteTeamMember({
      ...input,
      color: input.color ?? palette[Math.floor(Math.random() * palette.length)],
      avatar: input.avatar ?? input.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    });
    set((s) => ({ users: [...s.users, u] }));
    return u;
  },
  updateTeamMember: async (id, patch) => {
    await updateProfileRecord(id, patch);
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  },
  removeTeamMember: async (id) => {
    await deleteProfileRecord(id);
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
  },
  resendTeamInvite: async (id) => {
    const u = get().users.find((u) => u.id === id);
    if (!u) throw new Error("Team member not found");
    await resendTeamInviteRecord(u.email);
  },

  /* Time — backed by Supabase (src/lib/data/time-entries.ts) */
  logTime: async (input) => {
    const te = await logTimeRecord({ ...input, date: input.date ?? today() });
    set((s) => ({ timeEntries: [te, ...s.timeEntries] }));
    return te;
  },
  updateTimeEntry: async (id, patch) => {
    await updateTimeEntryRecord(id, patch);
    set((s) => ({ timeEntries: s.timeEntries.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  deleteTimeEntry: async (id) => {
    await deleteTimeEntryRecord(id);
    set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) }));
  },

  /* Comments — backed by Supabase (src/lib/data/comments.ts) */
  createComment: async (input) => {
    const s0 = get();
    const threadType: ThreadType = s0.tasks.some((t) => t.id === input.threadId)
      ? "task"
      : s0.requests.some((r) => r.id === input.threadId)
        ? "request"
        : "project";
    const c = await createCommentRecord({ ...input, threadType, visibility: input.visibility ?? "client" });
    set((s) => {
      // Also update comment count on the task if threadId represents a task
      const updatedTasks = s.tasks.map((t) => {
        if (t.id === input.threadId) {
          const addedAttachments = input.attachments?.length ?? 0;
          return {
            ...t,
            comments: (t.comments || 0) + 1,
            attachments: (t.attachments || 0) + addedAttachments,
          };
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

  /* Channels */
  markChannelAsRead: (channelId) => {
    set((s) => ({
      channels: s.channels.map((c) => (c.id === channelId ? { ...c, unread: 0 } : c)),
    }));
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
  mapProjectStorage: (projectId, provider, email, folderName) => {
    const id = uid("psm");
    const newMapping: ProjectStorageMapping = {
      id,
      projectId,
      provider,
      email,
      folderName,
      connectedAt: "Just now",
    };
    const mockDoc1: Document = {
      id: uid("doc"),
      projectId,
      folder: folderName,
      name: `${folderName.replace(/[\s/]+/g, "-")}-Mock-Specs.pdf`,
      size: "2.4 MB",
      uploadedBy: "u1",
      uploadedAt: "Just now",
      shared: true
    };
    const mockDoc2: Document = {
      id: uid("doc"),
      projectId,
      folder: folderName,
      name: `${folderName.replace(/[\s/]+/g, "-")}-Mock-Assets.zip`,
      size: "8.1 MB",
      uploadedBy: "u1",
      uploadedAt: "Just now",
      shared: false
    };
    set((s) => ({
      projectStorageMappings: [...s.projectStorageMappings, newMapping],
      documents: [mockDoc1, mockDoc2, ...s.documents]
    }));
  },
  unmapProjectStorage: (id) => {
    set((s) => {
      const mapping = s.projectStorageMappings.find((m) => m.id === id);
      const docsToKeep = mapping
        ? s.documents.filter((d) => !(d.projectId === mapping.projectId && d.folder === mapping.folderName))
        : s.documents;
      return {
        projectStorageMappings: s.projectStorageMappings.filter((m) => m.id !== id),
        documents: docsToKeep,
      };
    });
  },

  /* AI */
  logAIAction: (a) =>
    set((s) => ({
      aiActions: [{ id: uid("ai"), ts: "Just now", ...a }, ...s.aiActions].slice(0, 50),
    })),
  updateWorkspaceName: (name) => set({ workspaceName: name }),
}));

/* ────────────────────── Derived helpers ────────────────────── */

/**
 * Whether a user is a working member of a project — either because they're
 * on the project's Management list (owner/manager oversight), or because
 * they're assigned to at least one task on it. Regular team members are
 * connected to projects purely through task assignment, so any "my
 * projects" view needs both signals, not just `project.team`.
 */
export function isProjectMember(project: Project, tasks: Task[], userId: string): boolean {
  if (project.team.includes(userId)) return true;
  return tasks.some((t) => t.projectId === project.id && t.assignees.includes(userId));
}

/**
 * All user ids actively associated with a project — the Management list
 * plus anyone assigned to at least one task on it. Used anywhere the app
 * shows "who's on this project" (avatar stacks, team panels) so it
 * reflects real task assignment, not just Management.
 */
export function projectMemberIds(project: Project, tasks: Task[]): string[] {
  const taskAssignees = tasks
    .filter((t) => t.projectId === project.id)
    .flatMap((t) => t.assignees);
  return Array.from(new Set([...project.team, ...taskAssignees]));
}

/**
 * Sums logged hours for a user from a real (Supabase-backed) TimeEntry[]
 * slice — e.g. `totalHoursByUser(useStore((s) => s.timeEntries), userId)`.
 * Replaces the old mock-data.ts helper of the same name, which read the
 * static seed timeEntries array instead of the store.
 */
export function totalHoursByUser(entries: TimeEntry[], userId: string): number {
  return entries.filter((t) => t.userId === userId).reduce((s, t) => s + t.hours, 0);
}

export function getProjectProgress(projectId: string) {
  const s = useStore.getState();
  const t = s.tasks.filter((x) => x.projectId === projectId);
  const completed = t.filter((x) => x.stage === "completed").length;
  const project = s.projects.find((p) => p.id === projectId);
  return {
    tasksTotal: t.length,
    tasksCompleted: completed,
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

export function useProjects() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);

  return useMemo(() => {
    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      let status: ProjectStatus = "planning";

      if (p.type === "retainer") {
        status = "ongoing";
      } else if (pTasks.length === 0) {
        status = "planning";
      } else {
        const allCompleted = pTasks.every((t) => t.stage === "completed");
        if (allCompleted) {
          status = "completed";
        } else {
          const hasTodo = pTasks.some((t) => t.stage === "todo");
          const hasInProgress = pTasks.some((t) => t.stage === "in_progress");
          const hasReview = pTasks.some((t) => t.stage === "in_review");
          if (!hasTodo && !hasInProgress && hasReview) {
            status = "review";
          } else {
            status = "in_progress";
          }
        }
      }

      const completed = pTasks.filter((t) => t.stage === "completed").length;
      const progress = pTasks.length ? Math.round((completed / pTasks.length) * 100) : 0;

      return {
        ...p,
        status,
        progress,
      };
    });
  }, [projects, tasks]);
}

export function useProject(projectId: string) {
  const projects = useProjects();
  return useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
}
