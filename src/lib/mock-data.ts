/**
 * Shared types + UI lookup-table constants for the MGL Portal.
 *
 * This file used to also hold the app's in-memory seed data. Every entity
 * now hydrates from Supabase (see src/lib/data/ + src/lib/store.ts), so the
 * seed arrays were removed — the demo data they held now lives in
 * scripts/seed-data.ts, used only by the one-time local seed script.
 */

export type Role = "owner" | "team" | "client" | "manager";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  status?: "Available" | "Busy";
  avatar: string; // initials-based avatar color seed
  color: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  workingHours?: string;
  address?: string;
  linkedin?: string;
  github?: string;
  notes?: string;
  city?: string;
  state?: string;
  hourlyRate?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  zipCode?: string;
  financialType?: string;
  financialAmount?: number;
  internalNotes?: string;
  /** Magic-link token granting this team/manager member access to their /team portal. */
  memberShareToken?: string;
  shortcuts?: Array<{
    name: string;
    link: string;
  }>;
};

export type Client = {
  id: string;
  name: string;
  industry: string;
  subIndustry?: string;
  logoColor: string;
  contact: string;
  contactEmail: string;
  contactAvatar?: string; // initials or image data URL for the client contact's profile photo
  status: "active" | "paused" | "archived";
  retainer: string;
  since: string;
  projects: number;
  openRequests: number;
  hoursMonth: number;
  health: "healthy" | "watch" | "at-risk";
  // Expanded fields:
  website?: string;
  phone?: string;
  businessEmail?: string;
  timezone?: string;
  address?: string;
  zipCode?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  preferredContactMethod?: "email" | "phone" | "messages";
  contactPhone?: string;
  contactRole?: string;
  workingHours?: string;
  preferredMeetingTimes?: string;
  availabilityNotes?: string;
  mapDirectionsLink?: string;
  notes?: string;
  internalNotes?: string;
  lastActivity?: string;
  currency?: string;
  tags?: string[];
  additionalContacts?: Array<{
    name: string;
    title: string;
    email: string;
    phone: string;
    department: string;
  }>;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    other?: string;
  };
  shareLinks?: ProjectShareLink[];
  logoUrl?: string;
  shortcuts?: Array<{
    name: string;
    link: string;
    displayInDropdown: boolean;
  }>;
};

export type ProjectStatus = "planning" | "in_progress" | "ongoing" | "review" | "completed";

export type ProjectShareLink = {
  id: string;
  userId: string;
  token: string;
  status: "active" | "disabled";
  permission: "owner" | "admin" | "edit" | "comment" | "view";
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
};

export type Project = {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  type: "fixed" | "hourly" | "retainer";
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
  visibility?: "private" | "team" | "client";
  /** ISO timestamp set when the project is created at runtime; seed projects leave this unset. */
  createdAt?: string;
  /** ISO timestamp set whenever the project is edited at runtime. */
  updatedAt?: string;
  notifications?: {
    tasks?: boolean;
    mentions?: boolean;
    comments?: boolean;
    status?: boolean;
    files?: boolean;
  };
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
  attachmentDocIds?: string[];
  comments: number;
  startDate?: string;
  tags?: string[];
  followers?: string[];
  estimatedHours?: number;
  customFields?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

export type RequestType =
  | "revision"
  | "new_task"
  | "new_project"
  | "meeting"
  | "question";

export type RequestStatus =
  | "submitted"
  | "under_review"
  | "closed"
  | "approved"
  | "convert"
  | "withdrawn";

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
  attachmentDocIds?: string[];
  estimatedHours?: number;
  priority: Priority;
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
  previewUrl?: string;
  /** Path within the `documents` Storage bucket — set once the file's
   * bytes have actually been uploaded (see uploadDocumentRecord). Absent
   * for placeholder ".keep" folder rows and any document created before
   * real Storage upload was wired up. */
  storagePath?: string;
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

// ─────────────────────────────────────────────────────────── UI lookup tables

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
  under_review: { label: "Under review", cls: "bg-violet-100 text-violet-700" },
  closed: { label: "Closed", cls: "bg-rose-100 text-rose-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  convert: { label: "Convert", cls: "bg-blue-100 text-blue-700" },
  withdrawn: { label: "Withdrawn", cls: "bg-muted text-muted-foreground" },
};

export const REQUEST_TYPE_META: Record<RequestType, { label: string; icon: string }> = {
  revision: { label: "Revision", icon: "RefreshCw" },
  new_task: { label: "Task", icon: "ListPlus" },
  new_project: { label: "Project", icon: "FolderPlus" },
  meeting: { label: "Meeting", icon: "Calendar" },
  question: { label: "Question", icon: "MessageCircleQuestion" },
};



export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "bg-todo text-todo-foreground" },
  in_progress: { label: "In progress", cls: "bg-progress text-progress-foreground" },
  ongoing: { label: "Ongoing", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  review: { label: "In review", cls: "bg-review text-review-foreground" },
  completed: { label: "Completed", cls: "bg-done text-done-foreground" },
};
