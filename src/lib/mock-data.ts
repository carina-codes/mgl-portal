/**
 * Mock data layer for the MGL Portal prototype.
 *
 * All data is in-memory. The shape mirrors what a future Supabase / Next.js
 * backend would return, so screens can be wired up to real services with
 * minimal refactoring later.
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
  { id: "u1", name: "Carina Rivera", email: "carina@mglagency.com", role: "owner", title: "Founder & Strategy Lead", color: "#0049FE", avatar: "CR", city: "Los Angeles", state: "CA", hourlyRate: 150 },
  { id: "u2", name: "Mia Tanaka", email: "mia@mglagency.com", role: "team", title: "Design Director", color: "#FF7A59", avatar: "MT", city: "San Francisco", state: "CA", hourlyRate: 125, memberShareToken: "mia-team-demo" },
  { id: "u3", name: "Devon Patel", email: "devon@mglagency.com", role: "team", title: "Senior Engineer", color: "#10B981", avatar: "DP", city: "New York", state: "NY", hourlyRate: 140 },
  { id: "u4", name: "Ava Lindgren", email: "ava@mglagency.com", role: "team", title: "Brand Designer", color: "#A855F7", avatar: "AL", city: "Austin", state: "TX", hourlyRate: 95 },
  { id: "u5", name: "Noah Carter", email: "noah@mglagency.com", role: "team", title: "Producer", color: "#F59E0B", avatar: "NC", city: "Chicago", state: "IL", hourlyRate: 110 },
  { id: "u6", name: "Priya Shah", email: "priya@mglagency.com", role: "team", title: "Motion Designer", color: "#EC4899", avatar: "PS", city: "Miami", state: "FL", hourlyRate: 105 },
  { id: "u10", name: "Jordan Reyes", email: "jordan@mglagency.com", role: "manager", title: "Project Manager", color: "#6366F1", avatar: "JR", city: "Denver", state: "CO", hourlyRate: 115, memberShareToken: "jordan-manager-demo" },
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
    industry: "Technology",
    subIndustry: "SaaS Project Management",
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
    website: "https://arcadia.com",
    phone: "+1 (555) 019-2834",
    timezone: "America/New_York",
    address: "100 Broadway, 24th Floor",
    city: "New York",
    state: "NY",
    country: "United States",
    preferredContactMethod: "email",
    contactPhone: "+1 (555) 019-2839",
    contactRole: "Chief Marketing Officer",
    workingHours: "9:00 AM - 6:00 PM EST",
    preferredMeetingTimes: "Tuesdays & Thursdays, 2:00 PM - 4:00 PM",
    availabilityNotes: "Marcus is out of office on Friday afternoons. For urgent design sign-offs, email Sarah.",
    mapDirectionsLink: "https://maps.google.com/?q=100+Broadway+New+York+NY",
    notes: "<h3>Arcadia Solutions Partnership</h3><p>Arcadia Solutions designs next-generation project collaboration tools for creators and engineers. Under active growth with a focus on web and mobile workflows. Key retainer client with highly technical specifications.</p>",
    internalNotes: "Keep design components strictly compliant with their brand guidelines. Marcus is detail-oriented and reviews Figma prototypes exhaustively.",
    lastActivity: "1 hour ago",
    currency: "USD",
    tags: ["Enterprise", "Retainer", "Tech"],
    additionalContacts: [
      { name: "Sarah Jenkins", title: "Product Manager", email: "sarah.j@arcadia.com", phone: "+1 (555) 019-2841", department: "Product" },
      { name: "David Miller", title: "VP Engineering", email: "david.m@arcadia.com", phone: "+1 (555) 019-2842", department: "Engineering" }
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/company/arcadia-solutions",
      twitter: "https://x.com/arcadia_sol",
      facebook: "https://facebook.com/arcadia.sol"
    }
  },
  {
    id: "c2",
    name: "Northwind Studio",
    industry: "Beauty",
    subIndustry: "Organic Skincare",
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
    website: "https://northwind.io",
    phone: "+1 (555) 831-2940",
    timezone: "America/Los_Angeles",
    address: "450 Sutter St, Suite 1200",
    city: "San Francisco",
    state: "CA",
    country: "United States",
    preferredContactMethod: "messages",
    contactPhone: "+1 (555) 831-2942",
    contactRole: "VP Marketing",
    workingHours: "8:00 AM - 5:00 PM PST",
    preferredMeetingTimes: "Wednesdays, 10:00 AM - 12:00 PM",
    availabilityNotes: "Elena prefers using the built-in portal messages over email.",
    mapDirectionsLink: "https://maps.google.com/?q=450+Sutter+St+San+Francisco+CA",
    notes: "<h3>Northwind Skincare Launch</h3><p>Northwind Studio is a direct-to-consumer organic skincare brand expanding its online platform with customized subscription plans and clean editorial visual assets.</p>",
    internalNotes: "Marketing timelines are tight. Watch the skincare campaign milestones carefully.",
    lastActivity: "2 hours ago",
    currency: "USD",
    tags: ["DTC", "Skincare", "E-commerce"],
    additionalContacts: [
      { name: "Oliver Sterling", title: "Creative Lead", email: "oliver@northwind.io", phone: "+1 (555) 831-2943", department: "Design" }
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/company/northwind-studio",
      instagram: "https://instagram.com/northwind.skincare"
    }
  },
  {
    id: "c3",
    name: "Lumen & Co.",
    industry: "Hospitality",
    subIndustry: "Boutique Hotels",
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
    website: "https://lumenco.com",
    phone: "+34 913 608 200",
    timezone: "Europe/Madrid",
    address: "Paseo de la Castellana, 12",
    city: "Madrid",
    state: "Madrid",
    country: "Spain",
    preferredContactMethod: "phone",
    contactPhone: "+34 610 998 221",
    contactRole: "Brand Director",
    workingHours: "9:00 AM - 6:00 PM CET",
    preferredMeetingTimes: "Mondays, 3:00 PM - 5:00 PM CET",
    availabilityNotes: "Sofia travels frequently. Always confirm meetings 24 hours in advance.",
    mapDirectionsLink: "https://maps.google.com/?q=Paseo+de+la+Castellana+12+Madrid",
    notes: "<h3>Lumen Rebrand & Digital Experience</h3><p>Lumen & Co. runs premium boutique hotels in southern Europe. Currently undergoing a full branding overhaul and digital reservations relaunch.</p>",
    internalNotes: "Retainer is currently at-risk due to delayed feedback cycles. Be proactive and schedule follow-ups via phone call.",
    lastActivity: "5 hours ago",
    tags: ["Hospitality", "Fixed-Bid", "Europe"],
    additionalContacts: [
      { name: "Carlos Vega", title: "Operations Manager", email: "carlos@lumenco.com", phone: "+34 610 998 225", department: "Operations" }
    ],
    socialLinks: {
      linkedin: "https://linkedin.com/company/lumen-hospitality",
      instagram: "https://instagram.com/lumen.hotels"
    }
  },
  {
    id: "c4",
    name: "Field & Form",
    industry: "Architecture",
    subIndustry: "Sustainable Residential",
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
    website: "https://fieldform.co",
    phone: "+1 (555) 728-1934",
    timezone: "America/Chicago",
    address: "222 Merchandise Mart Plaza, Suite 400",
    city: "Chicago",
    state: "IL",
    country: "United States",
    preferredContactMethod: "email",
    contactPhone: "+1 (555) 728-1937",
    contactRole: "Principal Architect",
    workingHours: "8:30 AM - 5:30 PM CST",
    preferredMeetingTimes: "Fridays, 9:00 AM - 11:00 AM",
    availabilityNotes: "Preferred meeting platform is Google Meet.",
    mapDirectionsLink: "https://maps.google.com/?q=222+Merchandise+Mart+Plaza+Chicago+IL",
    notes: "<h3>Field & Form Digital Portfolio</h3><p>A high-end architectural firm specializing in modern sustainable residential design. Building a marketing portfolio site to display their award-winning projects.</p>",
    internalNotes: "Portfolio project is high profile. Keep typography and minimal layout clean.",
    lastActivity: "1 day ago",
    tags: ["Architecture", "Portfolio", "Marketing-Site"],
    additionalContacts: [],
    socialLinks: {
      linkedin: "https://linkedin.com/company/field-form-architecture"
    }
  },
  {
    id: "c5",
    name: "Halcyon Health",
    industry: "Healthcare",
    subIndustry: "HealthTech",
    logoColor: "#EC4899",
    contact: "Daniel Chen",
    contactEmail: "daniel@halcyon.health",
    status: "paused",
    retainer: "$22k / mo",
    since: "Oct 2023",
    projects: 1,
    openRequests: 0,
    hoursMonth: 0,
    health: "watch",
    website: "https://halcyon.health",
    phone: "+1 (555) 289-4055",
    timezone: "America/Los_Angeles",
    address: "548 Market St, Suite 900",
    city: "San Francisco",
    state: "CA",
    country: "United States",
    preferredContactMethod: "email",
    contactPhone: "+1 (555) 289-4057",
    contactRole: "Head of Product",
    workingHours: "9:00 AM - 5:00 PM PST",
    preferredMeetingTimes: "Thursdays, 3:00 PM - 5:00 PM",
    availabilityNotes: "Daniel is currently out of office on a product retreat. Re-engagement scheduled for Q3.",
    mapDirectionsLink: "https://maps.google.com/?q=548+Market+St+San+Francisco+CA",
    notes: "<h3>Halcyon Product Overhaul</h3><p>Healthtech platform focusing on digital health records and outpatient scheduling systems. Retainer currently paused while their internal development team prepares initial API specs.</p>",
    internalNotes: "Check in with Daniel in late July to discuss resuming active sprints.",
    lastActivity: "2 weeks ago",
    tags: ["Healthtech", "Product-Design", "Paused"],
    additionalContacts: [],
    socialLinks: {
      linkedin: "https://linkedin.com/company/halcyon-health"
    }
  }
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
    team: ["u1", "u2", "u3", "u6", "u10"],
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
    team: ["u1", "u2", "u4", "u5"],
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
    team: ["u1", "u2", "u4", "u6"],
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
    team: ["u1", "u4", "u6"],
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
    team: ["u1", "u2", "u3", "u4"],
    lead: "u3",
    description: "Editorial marketing site for a boutique architecture firm — portfolio, journal, contact flow.",
    accent: "progress",
  },
  {
    id: "p8",
    name: "Halcyon CarePortal Support",
    clientId: "c5",
    status: "ongoing",
    type: "retainer",
    budget: 22000,
    spent: 8500,
    hoursEstimate: 160,
    hoursLogged: 62,
    startDate: "Jun 23, 2026",
    endDate: "Dec 23, 2026",
    progress: 38,
    team: ["u1", "u2", "u6"],
    lead: "u2",
    description: "Ongoing Patient Portal retainer for maintenance, security patches, telemedicine SLA, and feature iterations.",
    accent: "done",
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
      
      // Seed realistic dates in June 2026 staggered by project index
      const startDay = 1 + ((idx + pIdx * 2) % 20);
      const dueDay = startDay + 1 + (idx % 6);
      const dueDate = `Jun ${dueDay.toString().padStart(2, "0")}`;
      const createdAt = `2026-06-${startDay.toString().padStart(2, "0")}T09:30:00Z`;
      const updatedAt = `2026-06-${startDay.toString().padStart(2, "0")}T15:45:00Z`;
      
      out.push({
        id: `${p.id}-t${i + 1}`,
        projectId: p.id,
        ...t,
        dueDate,
        startDate: `2026-06-${startDay.toString().padStart(2, "0")}`,
        tags: ["Design", "Dev", "Client Feedback"].slice(0, (i % 3) + 1),
        followers: ["u1", "u2", "u3"].slice(0, (i % 2) + 1),
        estimatedHours: 4 + (i % 5) * 4,
        createdAt,
        updatedAt,
      });
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
  { id: "r1", clientId: "c1", projectId: "p1", type: "revision", title: "Soften hero gradient on onboarding screen", description: "Marcus mentioned the gradient feels too saturated next to product UI screenshots.", status: "under_review", submittedAt: "2 hours ago", submittedBy: "u8", priority: "medium" },
  { id: "r2", clientId: "c1", projectId: "p2", type: "new_task", title: "Add testimonials carousel to pricing page", description: "Three quotes ready, would like the same card layout as homepage.", status: "submitted", submittedAt: "Yesterday", submittedBy: "u8", priority: "low" },
  { id: "r3", clientId: "c1", type: "new_project", title: "Q4 partnership microsite", description: "Co-branded with Linear. ~3 pages, launch by Sep 30.", status: "under_review", submittedAt: "2 days ago", submittedBy: "u8", priority: "high" },
  { id: "r4", clientId: "c2", projectId: "p4", type: "meeting", title: "Updated product photography (24 SKUs)", description: "Fresh photography for hero placements and PDP.", status: "approved", submittedAt: "3 days ago", submittedBy: "u7", priority: "medium" },
  { id: "r5", clientId: "c2", projectId: "p4", type: "revision", title: "Tighten kerning on wordmark", description: "Slight optical adjustment between N and o.", status: "convert", submittedAt: "4 days ago", submittedBy: "u7", priority: "low" },
  { id: "r6", clientId: "c3", projectId: "p6", type: "question", title: "Can we explore a serif system for menus?", description: "Considering an editorial direction for in-room print.", status: "submitted", submittedAt: "5 hours ago", submittedBy: "u9", priority: "low" },
  { id: "r7", clientId: "c3", projectId: "p6", type: "new_task", title: "Add downloadable brand kit to client portal", description: "PDF + zipped assets so the team can self-serve.", status: "approved", submittedAt: "Today", submittedBy: "u9", priority: "medium" },
  { id: "r8", clientId: "c3", type: "new_project", title: "Lumen rooftop bar concept", description: "Branding, menu system and digital reservations site.", status: "submitted", submittedAt: "1 hour ago", submittedBy: "u9", priority: "high" },
  { id: "r9", clientId: "c4", projectId: "p7", type: "revision", title: "Update lead architect bio", description: "New copy attached.", status: "convert", submittedAt: "1 day ago", submittedBy: "u7", priority: "low" },
  { id: "r10", clientId: "c1", projectId: "p2", type: "question", title: "Is Sentry monitoring included this sprint?", description: "Want to confirm scope before launch.", status: "submitted", submittedAt: "30 mins ago", submittedBy: "u8", priority: "low" },
];



// ─────────────────────────────────────────────────────────── Documents

export const documents: Document[] = [
  { id: "doc1", projectId: "p1", name: "NovaBoard SOW.pdf", folder: "Contracts", size: "428 KB", uploadedBy: "u1", uploadedAt: "May 1", shared: true, previewUrl: "https://pdfobject.com/pdf/sample.pdf" },
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
  { id: "ch2", name: "Arcadia — internal", clientId: "c1", unread: 0, lastMessage: "Carina: budget check for Q3 planning", lastAt: "3h" },
  { id: "ch3", name: "Northwind Brand", projectId: "p4", clientId: "c2", unread: 1, lastMessage: "Elena: love the kerning round 2", lastAt: "Yest" },
  { id: "ch4", name: "Lumen Rebrand", projectId: "p6", clientId: "c3", unread: 2, lastMessage: "Sofia: any update on signage spec?", lastAt: "Yest" },
  { id: "ch5", name: "Field & Form Site", projectId: "p7", clientId: "c4", unread: 0, lastMessage: "Devon: shipped homepage to staging", lastAt: "2d" },
  { id: "ch6", name: "Workspace — design crit", unread: 0, lastMessage: "Ava: anyone up for crit Thursday?", lastAt: "2d" },
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
  const today = new Date("2026-06-21T12:00:00Z");
  projects.forEach((p) => {
    const projectTasks = tasksByProject(p.id);
    p.team.forEach((uid) => {
      // Tasks this person is actually assigned to, so logged time lines up
      // with their work — falls back to any task in the project.
      const relevantTasks = projectTasks.filter((t) => t.assignees.includes(uid));
      const candidateTasks = relevantTasks.length ? relevantTasks : projectTasks;

      for (let d = 0; d < 6; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        // Deterministic hours and billable values to prevent hydration errors
        const seed = (id * 7 + d * 13) % 20;
        const hours = 1.0 + (seed % 8) * 0.5; // 1.0 to 4.5
        const billable = ((id * 3 + d * 7) % 10) < 8; // ~80% billable
        // ~75% of entries are logged against a specific task; the rest are
        // general project work with no task attached.
        const hasTask = candidateTasks.length > 0 && id % 4 !== 0;
        const task = hasTask ? candidateTasks[id % candidateTasks.length] : undefined;
        out.push({
          id: `te${id++}`,
          userId: uid,
          projectId: p.id,
          taskId: task?.id,
          date: date.toISOString().slice(0, 10),
          hours,
          note: ["Design exploration", "Async review", "Pairing session", "Client call prep", "QA pass", "Implementation"][d % 6],
          billable,
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
