/**
 * Seed data for scripts/seed.ts only — never imported by the Next.js app.
 *
 * This used to live in src/lib/mock-data.ts as the app's in-memory data
 * source. Once every entity was migrated to hydrate from Supabase (see
 * src/lib/data/ and src/lib/store.ts), these arrays became dead weight in
 * the app bundle — kept only so scripts/seed.ts has something to seed a
 * fresh project with. Relocating them here keeps src/lib/mock-data.ts to
 * just types + UI lookup-table constants (STAGE_META, PRIORITY_META, etc.),
 * which the app still uses at runtime.
 */
import type {
  User,
  Client,
  Project,
  Task,
  ClientRequest,
  TimeEntry,
  Document,
  Message,
  Channel,
} from "../src/lib/mock-data";

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
    projects: 1,
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
    projects: 1,
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
];

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

function tasksByProject(projectId: string) {
  return tasks.filter((t) => t.projectId === projectId);
}

// ─────────────────────────────────────────────────────────── Requests

export const requests: ClientRequest[] = [
  { id: "r1", clientId: "c1", projectId: "p1", type: "revision", title: "Soften hero gradient on onboarding screen", description: "Marcus mentioned the gradient feels too saturated next to product UI screenshots.", status: "under_review", submittedAt: "2 hours ago", submittedBy: "u8", priority: "medium" },
  { id: "r3", clientId: "c1", type: "new_project", title: "Q4 partnership microsite", description: "Co-branded with Linear. ~3 pages, launch by Sep 30.", status: "under_review", submittedAt: "2 days ago", submittedBy: "u8", priority: "high" },
  { id: "r4", clientId: "c2", projectId: "p4", type: "meeting", title: "Updated product photography (24 SKUs)", description: "Fresh photography for hero placements and PDP.", status: "approved", submittedAt: "3 days ago", submittedBy: "u7", priority: "medium" },
  { id: "r5", clientId: "c2", projectId: "p4", type: "revision", title: "Tighten kerning on wordmark", description: "Slight optical adjustment between N and o.", status: "convert", submittedAt: "4 days ago", submittedBy: "u7", priority: "low" },
  { id: "r6", clientId: "c3", projectId: "p6", type: "question", title: "Can we explore a serif system for menus?", description: "Considering an editorial direction for in-room print.", status: "submitted", submittedAt: "5 hours ago", submittedBy: "u9", priority: "low" },
  { id: "r7", clientId: "c3", projectId: "p6", type: "new_task", title: "Add downloadable brand kit to client portal", description: "PDF + zipped assets so the team can self-serve.", status: "approved", submittedAt: "Today", submittedBy: "u9", priority: "medium" },
  { id: "r8", clientId: "c3", type: "new_project", title: "Lumen rooftop bar concept", description: "Branding, menu system and digital reservations site.", status: "submitted", submittedAt: "1 hour ago", submittedBy: "u9", priority: "high" },
];

// ─────────────────────────────────────────────────────────── Documents

export const documents: Document[] = [
  { id: "doc1", projectId: "p1", name: "NovaBoard SOW.pdf", folder: "Contracts", size: "428 KB", uploadedBy: "u1", uploadedAt: "May 1", shared: true, previewUrl: "https://pdfobject.com/pdf/sample.pdf" },
  { id: "doc2", projectId: "p1", name: "Brand assets — primary.zip", folder: "Brand", size: "82 MB", uploadedBy: "u4", uploadedAt: "May 14", shared: true },
  { id: "doc3", projectId: "p1", name: "API contracts — internal.md", folder: "Engineering", size: "12 KB", uploadedBy: "u3", uploadedAt: "Jun 2", shared: false },
  { id: "doc4", projectId: "p1", name: "User research — interview notes.docx", folder: "Research", size: "1.2 MB", uploadedBy: "u2", uploadedAt: "May 22", shared: false },
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
