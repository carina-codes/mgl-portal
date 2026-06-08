/**
 * Mock data layer for the MGL Client Platform prototype.
 *
 * All data is in-memory. The shape mirrors what a future Supabase / Next.js
 * backend would return, so screens can be wired up to real services with
 * minimal refactoring later.
 */

export type Role = "owner" | "team" | "client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar: string; // initials-based avatar color seed
  color: string;
};

export type Client = {
  id: string;
  name: string;
  industry: string;
  logoColor: string;
  contact: string;
  contactEmail: string;
  status: "active" | "paused" | "archived";
  retainer: string;
  since: string;
  projects: number;
  openRequests: number;
  hoursMonth: number;
  health: "healthy" | "watch" | "at-risk";
};

export type ProjectStatus = "planning" | "in_progress" | "review" | "completed" | "on_hold";

export type Project = {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  type: "fixed" | "hourly";
  budget: number;
  spent: number;
  hoursEstimate: number;
  hoursLogged: number;
  startDate: string;
  endDate: string;
  progress: number;
  team: string[]; // user ids
  lead: string;
  description: string;
  accent: "todo" | "progress" | "review" | "done";
};

export type TaskStage = "todo" | "in_progress" | "in_review" | "completed";
export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  note: string;
  stage: TaskStage;
  priority: Priority;
  progress: number;
  dueDate: string;
  assignees: string[];
  attachments: number;
  comments: number;
};

export type RequestType =
  | "revision"
  | "new_task"
  | "new_project"
  | "asset_upload"
  | "question";

export type RequestStatus =
  | "submitted"
  | "needs_clarification"
  | "under_review"
  | "approved"
  | "rejected"
  | "converted_task"
  | "converted_project";

export type ClientRequest = {
  id: string;
  clientId: string;
  projectId?: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  submittedAt: string;
  submittedBy: string; // user id
  estimatedHours?: number;
  priority: Priority;
};

export type DeliverableStatus =
  | "draft"
  | "internal_review"
  | "client_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export type Deliverable = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  version: string;
  status: DeliverableStatus;
  updatedAt: string;
  thumbnail: string; // gradient seed
  fileCount: number;
  feedback: number;
};

export type Comment = {
  id: string;
  threadId: string; // project/task/request id
  author: string; // user id
  body: string;
  createdAt: string;
  visibility: "internal" | "client";
  attachments?: string[];
};

export type TimeEntry = {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  date: string;
  hours: number;
  note: string;
  billable: boolean;
};

export type Document = {
  id: string;
  projectId: string;
  name: string;
  folder: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  shared: boolean;
};

export type Message = {
  id: string;
  channelId: string;
  author: string;
  body: string;
  createdAt: string;
  visibility: "internal" | "client";
};

export type Channel = {
  id: string;
  name: string;
  projectId?: string;
  clientId?: string;
  unread: number;
  lastMessage: string;
  lastAt: string;
};

// ─────────────────────────────────────────────────────────── Users / Team

export const users: User[] = [
  { id: "u1", name: "Jordan Reyes", email: "jordan@mglagency.com", role: "owner", title: "Founder & Strategy Lead", color: "#0049FE", avatar: "JR" },
  { id: "u2", name: "Mia Tanaka", email: "mia@mglagency.com", role: "team", title: "Design Director", color: "#FF7A59", avatar: "MT" },
  { id: "u3", name: "Devon Patel", email: "devon@mglagency.com", role: "team", title: "Senior Engineer", color: "#10B981", avatar: "DP" },
  { id: "u4", name: "Ava Lindgren", email: "ava@mglagency.com", role: "team", title: "Brand Designer", color: "#A855F7", avatar: "AL" },
  { id: "u5", name: "Noah Carter", email: "noah@mglagency.com", role: "team", title: "Producer", color: "#F59E0B", avatar: "NC" },
  { id: "u6", name: "Priya Shah", email: "priya@mglagency.com", role: "team", title: "Motion Designer", color: "#EC4899", avatar: "PS" },
  // Client-side users
  { id: "u7", name: "Elena Brooks", email: "elena@northwind.io", role: "client", title: "VP Marketing, Northwind", color: "#0EA5E9", avatar: "EB" },
  { id: "u8", name: "Marcus Hale", email: "marcus@arcadia.com", role: "client", title: "CMO, Arcadia Solutions", color: "#84CC16", avatar: "MH" },
  { id: "u9", name: "Sofia Romero", email: "sofia@lumenco.com", role: "client", title: "Brand Lead, Lumen & Co.", color: "#F43F5E", avatar: "SR" },
];

export const currentTeam = users.filter((u) => u.role !== "client");

export function getUser(id: string): User {
  return users.find((u) => u.id === id) ?? users[0];
}

// ─────────────────────────────────────────────────────────── Clients

export const clients: Client[] = [
  {
    id: "c1",
    name: "Arcadia Solutions",
    industry: "SaaS · Project tooling",
    logoColor: "#0049FE",
    contact: "Marcus Hale",
    contactEmail: "marcus@arcadia.com",
    status: "active",
    retainer: "$18k / mo",
    since: "Jan 2024",
    projects: 3,
    openRequests: 4,
    hoursMonth: 62,
    health: "healthy",
  },
  {
    id: "c2",
    name: "Northwind Studio",
    industry: "DTC · Skincare",
    logoColor: "#FF7A59",
    contact: "Elena Brooks",
    contactEmail: "elena@northwind.io",
    status: "active",
    retainer: "$12k / mo",
    since: "Mar 2024",
    projects: 2,
    openRequests: 2,
    hoursMonth: 41,
    health: "watch",
  },
  {
    id: "c3",
    name: "Lumen & Co.",
    industry: "Hospitality · Branding",
    logoColor: "#A855F7",
    contact: "Sofia Romero",
    contactEmail: "sofia@lumenco.com",
    status: "active",
    retainer: "Fixed bid",
    since: "Aug 2025",
    projects: 1,
    openRequests: 3,
    hoursMonth: 28,
    health: "at-risk",
  },
  {
    id: "c4",
    name: "Field & Form",
    industry: "Architecture · Marketing site",
    logoColor: "#10B981",
    contact: "Olivia Park",
    contactEmail: "olivia@fieldform.co",
    status: "active",
    retainer: "Project",
    since: "Sep 2025",
    projects: 1,
    openRequests: 1,
    hoursMonth: 19,
    health: "healthy",
  },
  {
    id: "c5",
    name: "Halcyon Health",
    industry: "Healthtech · Product design",
    logoColor: "#EC4899",
    contact: "Daniel Chen",
    contactEmail: "daniel@halcyon.health",
    status: "paused",
    retainer: "$22k / mo",
    since: "Oct 2023",
    projects: 0,
    openRequests: 0,
    hoursMonth: 0,
    health: "watch",
  },
];

// ─────────────────────────────────────────────────────────── Projects

export const projects: Project[] = [
  {
    id: "p1",
    name: "NovaBoard Mobile App",
    clientId: "c1",
    status: "in_progress",
    type: "fixed",
    budget: 85000,
    spent: 51200,
    hoursEstimate: 480,
    hoursLogged: 312,
    startDate: "May 20, 2026",
    endDate: "Jun 30, 2026",
    progress: 64,
    team: ["u1", "u2", "u3", "u6"],
    lead: "u2",
    description:
      "Native mobile companion for the NovaBoard SaaS suite — onboarding, board view, notifications and a client-facing review mode.",
    accent: "progress",
  },
  {
    id: "p2",
    name: "Arcadia Marketing Site Refresh",
    clientId: "c1",
    status: "review",
    type: "fixed",
    budget: 42000,
    spent: 38400,
    hoursEstimate: 220,
    hoursLogged: 198,
    startDate: "Apr 02, 2026",
    endDate: "Jun 10, 2026",
    progress: 88,
    team: ["u2", "u4", "u5"],
    lead: "u4",
    description: "Full marketing site redesign covering homepage, product, pricing and resources hubs.",
    accent: "review",
  },
  {
    id: "p3",
    name: "Arcadia Q3 Campaign",
    clientId: "c1",
    status: "planning",
    type: "hourly",
    budget: 22000,
    spent: 3100,
    hoursEstimate: 140,
    hoursLogged: 18,
    startDate: "Jun 15, 2026",
    endDate: "Sep 10, 2026",
    progress: 12,
    team: ["u1", "u4", "u6"],
    lead: "u1",
    description: "Multi-channel growth campaign — landing pages, paid creative, lifecycle emails.",
    accent: "todo",
  },
  {
    id: "p4",
    name: "Northwind Brand System",
    clientId: "c2",
    status: "in_progress",
    type: "fixed",
    budget: 56000,
    spent: 28800,
    hoursEstimate: 300,
    hoursLogged: 152,
    startDate: "May 01, 2026",
    endDate: "Jul 20, 2026",
    progress: 48,
    team: ["u2", "u4", "u6"],
    lead: "u4",
    description: "Visual identity refresh, packaging system, web art direction and motion guidelines.",
    accent: "progress",
  },
  {
    id: "p5",
    name: "Northwind Holiday Drop",
    clientId: "c2",
    status: "planning",
    type: "fixed",
    budget: 18000,
    spent: 900,
    hoursEstimate: 90,
    hoursLogged: 5,
    startDate: "Jul 01, 2026",
    endDate: "Oct 15, 2026",
    progress: 4,
    team: ["u4", "u6"],
    lead: "u6",
    description: "Limited edition holiday line — packaging, photography direction, launch microsite.",
    accent: "todo",
  },
  {
    id: "p6",
    name: "Lumen Hotel Rebrand",
    clientId: "c3",
    status: "in_progress",
    type: "fixed",
    budget: 120000,
    spent: 78900,
    hoursEstimate: 640,
    hoursLogged: 412,
    startDate: "Aug 15, 2025",
    endDate: "Jul 30, 2026",
    progress: 72,
    team: ["u1", "u2", "u4", "u5", "u6"],
    lead: "u1",
    description: "Hospitality rebrand spanning identity, signage, in-room collateral and digital touchpoints.",
    accent: "progress",
  },
  {
    id: "p7",
    name: "Field & Form Marketing Site",
    clientId: "c4",
    status: "in_progress",
    type: "hourly",
    budget: 32000,
    spent: 14200,
    hoursEstimate: 180,
    hoursLogged: 78,
    startDate: "Sep 10, 2025",
    endDate: "Jul 15, 2026",
    progress: 42,
    team: ["u2", "u3", "u4"],
    lead: "u3",
    description: "Editorial marketing site for a boutique architecture firm — portfolio, journal, contact flow.",
    accent: "progress",
  },
];

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

// ─────────────────────────────────────────────────────────── Tasks (Kanban)

const taskSeeds: Array<Omit<Task, "id" | "projectId">> = [
  // To Do
  { title: "Design Notification Banner", note: "Ensure it adapts well in both light and dark themes.", stage: "todo", priority: "medium", progress: 0, dueDate: "Jun 14", assignees: ["u2"], attachments: 0, comments: 2 },
  { title: "Write Error Message Guidelines", note: "Voice and tone reference for the design system.", stage: "todo", priority: "low", progress: 0, dueDate: "Jun 16", assignees: ["u4"], attachments: 1, comments: 1 },
  { title: "Create Avatar Component", note: "Variants for solo, paired and stacked groups.", stage: "todo", priority: "medium", progress: 10, dueDate: "Jun 18", assignees: ["u3"], attachments: 2, comments: 0 },
  { title: "Audit empty states across app", note: "List every empty state and propose a unified pattern.", stage: "todo", priority: "low", progress: 0, dueDate: "Jun 21", assignees: ["u2"], attachments: 0, comments: 1 },

  // In Progress
  { title: "Create Dashboard Wireframe", note: "Client wants more whitespace in the left sidebar.", stage: "in_progress", priority: "high", progress: 60, dueDate: "Jun 12", assignees: ["u2", "u4"], attachments: 3, comments: 5 },
  { title: "API Endpoint Mapping", note: "Map mobile views to existing REST + new GraphQL.", stage: "in_progress", priority: "medium", progress: 40, dueDate: "Jun 13", assignees: ["u3"], attachments: 2, comments: 1 },
  { title: "Dark Mode Theme Integration", note: "Token rollout across web app shell.", stage: "in_progress", priority: "low", progress: 25, dueDate: "Jun 19", assignees: ["u3", "u4"], attachments: 1, comments: 2 },

  // In Review
  { title: "Mobile Navigation Prototype", note: "Check responsiveness on iOS devices.", stage: "in_review", priority: "low", progress: 100, dueDate: "Jun 09", assignees: ["u6"], attachments: 2, comments: 4 },
  { title: "Team Settings Layout", note: "Awaiting accessibility review.", stage: "in_review", priority: "medium", progress: 100, dueDate: "Jun 10", assignees: ["u2", "u4"], attachments: 1, comments: 3 },

  // Completed
  { title: "Landing Page Copywriting", note: "Approved by Marcus on Jun 4.", stage: "completed", priority: "medium", progress: 100, dueDate: "Jun 04", assignees: ["u1", "u4"], attachments: 2, comments: 6 },
  { title: "Brand Color Exploration", note: "Colors approved for both web and mobile.", stage: "completed", priority: "medium", progress: 100, dueDate: "May 30", assignees: ["u4", "u2", "u6"], attachments: 3, comments: 1 },
  { title: "App Icon Design", note: "Submitted to App Store assets.", stage: "completed", priority: "high", progress: 100, dueDate: "May 28", assignees: ["u4", "u6", "u2"], attachments: 1, comments: 3 },
];

function buildTasks(): Task[] {
  const out: Task[] = [];
  projects.forEach((p, pIdx) => {
    taskSeeds.forEach((seed, i) => {
      // Stagger so every project has tasks but slightly different
      const shift = pIdx % 4;
      const idx = (i + shift) % taskSeeds.length;
      const t = taskSeeds[idx];
      out.push({ id: `${p.id}-t${i + 1}`, projectId: p.id, ...t });
    });
  });
  return out;
}

export const tasks: Task[] = buildTasks();

export function tasksByProject(projectId: string) {
  return tasks.filter((t) => t.projectId === projectId);
}

// ─────────────────────────────────────────────────────────── Requests

export const requests: ClientRequest[] = [
  { id: "r1", clientId: "c1", projectId: "p1", type: "revision", title: "Soften hero gradient on onboarding screen", description: "Marcus mentioned the gradient feels too saturated next to product UI screenshots.", status: "under_review", submittedAt: "2 hours ago", submittedBy: "u8", estimatedHours: 3, priority: "medium" },
  { id: "r2", clientId: "c1", projectId: "p2", type: "new_task", title: "Add testimonials carousel to pricing page", description: "Three quotes ready, would like the same card layout as homepage.", status: "submitted", submittedAt: "Yesterday", submittedBy: "u8", priority: "low" },
  { id: "r3", clientId: "c1", type: "new_project", title: "Q4 partnership microsite", description: "Co-branded with Linear. ~3 pages, launch by Sep 30.", status: "needs_clarification", submittedAt: "2 days ago", submittedBy: "u8", priority: "high" },
  { id: "r4", clientId: "c2", projectId: "p4", type: "asset_upload", title: "Updated product photography (24 SKUs)", description: "Fresh photography for hero placements and PDP.", status: "approved", submittedAt: "3 days ago", submittedBy: "u7", priority: "medium" },
  { id: "r5", clientId: "c2", projectId: "p4", type: "revision", title: "Tighten kerning on wordmark", description: "Slight optical adjustment between N and o.", status: "converted_task", submittedAt: "4 days ago", submittedBy: "u7", estimatedHours: 1, priority: "low" },
  { id: "r6", clientId: "c3", projectId: "p6", type: "question", title: "Can we explore a serif system for menus?", description: "Considering an editorial direction for in-room print.", status: "submitted", submittedAt: "5 hours ago", submittedBy: "u9", priority: "low" },
  { id: "r7", clientId: "c3", projectId: "p6", type: "new_task", title: "Add downloadable brand kit to client portal", description: "PDF + zipped assets so the team can self-serve.", status: "approved", submittedAt: "Today", submittedBy: "u9", estimatedHours: 4, priority: "medium" },
  { id: "r8", clientId: "c3", type: "new_project", title: "Lumen rooftop bar concept", description: "Branding, menu system and digital reservations site.", status: "submitted", submittedAt: "1 hour ago", submittedBy: "u9", priority: "high" },
  { id: "r9", clientId: "c4", projectId: "p7", type: "revision", title: "Update lead architect bio", description: "New copy attached.", status: "converted_task", submittedAt: "1 day ago", submittedBy: "u7", priority: "low" },
  { id: "r10", clientId: "c1", projectId: "p2", type: "question", title: "Is Sentry monitoring included this sprint?", description: "Want to confirm scope before launch.", status: "submitted", submittedAt: "30 mins ago", submittedBy: "u8", priority: "low" },
];

// ─────────────────────────────────────────────────────────── Deliverables

export const deliverables: Deliverable[] = [
  { id: "d1", projectId: "p1", title: "Onboarding flow — v3", description: "Updated based on Marcus' Jun 5 feedback.", version: "v3", status: "client_review", updatedAt: "1h ago", thumbnail: "from-[oklch(0.94_0.045_60)] to-[oklch(0.93_0.045_295)]", fileCount: 12, feedback: 4 },
  { id: "d2", projectId: "p1", title: "Notification system — concepts", description: "Three directions for in-app + push.", version: "v1", status: "internal_review", updatedAt: "3h ago", thumbnail: "from-[oklch(0.94_0.04_230)] to-[oklch(0.94_0.035_14)]", fileCount: 8, feedback: 2 },
  { id: "d3", projectId: "p2", title: "Pricing page — final", description: "Awaiting client sign-off.", version: "v4", status: "approved", updatedAt: "Yesterday", thumbnail: "from-[oklch(0.93_0.045_295)] to-[oklch(0.94_0.04_230)]", fileCount: 6, feedback: 11 },
  { id: "d4", projectId: "p4", title: "Northwind wordmark — refinements", description: "Tightened kerning round 2.", version: "v2", status: "revision_requested", updatedAt: "2d ago", thumbnail: "from-[oklch(0.94_0.045_60)] to-[oklch(0.94_0.04_230)]", fileCount: 4, feedback: 7 },
  { id: "d5", projectId: "p6", title: "Lumen brand book", description: "Draft for internal review.", version: "v1", status: "draft", updatedAt: "4d ago", thumbnail: "from-[oklch(0.93_0.045_295)] to-[oklch(0.94_0.035_14)]", fileCount: 32, feedback: 0 },
  { id: "d6", projectId: "p7", title: "Field & Form homepage R1", description: "First pass at editorial homepage.", version: "v1", status: "client_review", updatedAt: "Today", thumbnail: "from-[oklch(0.94_0.04_230)] to-[oklch(0.93_0.045_295)]", fileCount: 5, feedback: 2 },
];

// ─────────────────────────────────────────────────────────── Documents

export const documents: Document[] = [
  { id: "doc1", projectId: "p1", name: "NovaBoard SOW.pdf", folder: "Contracts", size: "428 KB", uploadedBy: "u1", uploadedAt: "May 1", shared: true },
  { id: "doc2", projectId: "p1", name: "Brand assets — primary.zip", folder: "Brand", size: "82 MB", uploadedBy: "u4", uploadedAt: "May 14", shared: true },
  { id: "doc3", projectId: "p1", name: "API contracts — internal.md", folder: "Engineering", size: "12 KB", uploadedBy: "u3", uploadedAt: "Jun 2", shared: false },
  { id: "doc4", projectId: "p1", name: "User research — interview notes.docx", folder: "Research", size: "1.2 MB", uploadedBy: "u2", uploadedAt: "May 22", shared: false },
  { id: "doc5", projectId: "p2", name: "Sitemap v2.fig", folder: "Design", size: "18 MB", uploadedBy: "u4", uploadedAt: "Apr 10", shared: true },
  { id: "doc6", projectId: "p4", name: "Brand strategy.pdf", folder: "Strategy", size: "3.4 MB", uploadedBy: "u1", uploadedAt: "May 5", shared: true },
  { id: "doc7", projectId: "p6", name: "Lumen — photoshoot brief.pdf", folder: "Production", size: "2.1 MB", uploadedBy: "u5", uploadedAt: "Apr 22", shared: true },
  { id: "doc8", projectId: "p6", name: "Signage spec — corridor.pdf", folder: "Production", size: "4.6 MB", uploadedBy: "u2", uploadedAt: "May 9", shared: false },
];

// ─────────────────────────────────────────────────────────── Messages / Channels

export const channels: Channel[] = [
  { id: "ch1", name: "NovaBoard Mobile", projectId: "p1", clientId: "c1", unread: 3, lastMessage: "Mia: pushed onboarding v3 for review", lastAt: "1h" },
  { id: "ch2", name: "Arcadia — internal", clientId: "c1", unread: 0, lastMessage: "Jordan: budget check for Q3 planning", lastAt: "3h" },
  { id: "ch3", name: "Northwind Brand", projectId: "p4", clientId: "c2", unread: 1, lastMessage: "Elena: love the kerning round 2", lastAt: "Yest" },
  { id: "ch4", name: "Lumen Rebrand", projectId: "p6", clientId: "c3", unread: 2, lastMessage: "Sofia: any update on signage spec?", lastAt: "Yest" },
  { id: "ch5", name: "Field & Form Site", projectId: "p7", clientId: "c4", unread: 0, lastMessage: "Devon: shipped homepage to staging", lastAt: "2d" },
  { id: "ch6", name: "Studio — design crit", unread: 0, lastMessage: "Ava: anyone up for crit Thursday?", lastAt: "2d" },
];

export const messages: Message[] = [
  { id: "m1", channelId: "ch1", author: "u8", body: "Just reviewed the onboarding v3 — feels really clean. One small ask: can we slow the transition between step 2 and 3?", createdAt: "Today · 10:42", visibility: "client" },
  { id: "m2", channelId: "ch1", author: "u2", body: "Great call — easing it now. Will repost as v3.1 by EOD.", createdAt: "Today · 10:51", visibility: "client" },
  { id: "m3", channelId: "ch1", author: "u3", body: "Internal: I'll wire the new transition curve to the design token so we don't drift from web.", createdAt: "Today · 10:57", visibility: "internal" },
  { id: "m4", channelId: "ch1", author: "u2", body: "Perfect. Marking the onboarding deliverable as ready for re-review.", createdAt: "Today · 11:14", visibility: "client" },
  { id: "m5", channelId: "ch1", author: "u8", body: "Thanks team 🙏", createdAt: "Today · 11:22", visibility: "client" },
];

// ─────────────────────────────────────────────────────────── Time entries

function generateTime(): TimeEntry[] {
  const out: TimeEntry[] = [];
  let id = 1;
  const today = new Date();
  projects.forEach((p) => {
    p.team.forEach((uid) => {
      for (let d = 0; d < 6; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        const hours = Math.round((Math.random() * 5 + 0.5) * 4) / 4;
        out.push({
          id: `te${id++}`,
          userId: uid,
          projectId: p.id,
          date: date.toISOString().slice(0, 10),
          hours,
          note: ["Design exploration", "Async review", "Pairing session", "Client call prep", "QA pass", "Implementation"][d % 6],
          billable: Math.random() > 0.15,
        });
      }
    });
  });
  return out;
}

export const timeEntries: TimeEntry[] = generateTime();

// ─────────────────────────────────────────────────────────── Helpers

export function totalHoursByProject(projectId: string) {
  return timeEntries.filter((t) => t.projectId === projectId).reduce((s, t) => s + t.hours, 0);
}

export function totalHoursByUser(userId: string) {
  return timeEntries.filter((t) => t.userId === userId).reduce((s, t) => s + t.hours, 0);
}

export const STAGE_META: Record<TaskStage, { label: string; tone: string; pill: string; dot: string }> = {
  todo: { label: "To Do", tone: "bg-todo", pill: "text-todo-foreground", dot: "bg-rose-400" },
  in_progress: { label: "In Progress", tone: "bg-progress", pill: "text-progress-foreground", dot: "bg-orange-400" },
  in_review: { label: "In Review", tone: "bg-review", pill: "text-review-foreground", dot: "bg-sky-400" },
  completed: { label: "Completed", tone: "bg-done", pill: "text-done-foreground", dot: "bg-violet-400" },
};

export const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-sky-100 text-sky-700" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700" },
  high: { label: "High", cls: "bg-rose-100 text-rose-700" },
};

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-sky-100 text-sky-700" },
  needs_clarification: { label: "Needs clarification", cls: "bg-amber-100 text-amber-700" },
  under_review: { label: "Under review", cls: "bg-violet-100 text-violet-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-700" },
  converted_task: { label: "Converted → Task", cls: "bg-blue-100 text-blue-700" },
  converted_project: { label: "Converted → Project", cls: "bg-blue-100 text-blue-700" },
};

export const REQUEST_TYPE_META: Record<RequestType, { label: string; icon: string }> = {
  revision: { label: "Revision", icon: "RefreshCw" },
  new_task: { label: "New task", icon: "ListPlus" },
  new_project: { label: "New project", icon: "FolderPlus" },
  asset_upload: { label: "Asset upload", icon: "Upload" },
  question: { label: "Question", icon: "MessageCircleQuestion" },
};

export const DELIVERABLE_STATUS_META: Record<DeliverableStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  internal_review: { label: "Internal review", cls: "bg-amber-100 text-amber-700" },
  client_review: { label: "Client review", cls: "bg-sky-100 text-sky-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-700" },
  revision_requested: { label: "Revision requested", cls: "bg-violet-100 text-violet-700" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "bg-todo text-todo-foreground" },
  in_progress: { label: "In progress", cls: "bg-progress text-progress-foreground" },
  review: { label: "In review", cls: "bg-review text-review-foreground" },
  completed: { label: "Completed", cls: "bg-done text-done-foreground" },
  on_hold: { label: "On hold", cls: "bg-muted text-muted-foreground" },
};
