/**
 * One-time seed script — populates a fresh Supabase project with data
 * equivalent to src/lib/mock-data.ts, so the app has something real to show
 * once store.ts stops reading from the mock arrays (see src/lib/data/).
 *
 * Uses the SERVICE ROLE key, which bypasses RLS entirely — this must only
 * ever run locally/offline, never in the browser or a client bundle.
 * Nothing here is imported by the Next.js app.
 *
 * Usage:
 *   1. Run the two migrations in supabase/migrations/ against your project.
 *   2. Add to .env.local (gitignored):
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...          (Project Settings → API — SECRET, never NEXT_PUBLIC_)
 *      Optionally: SEED_OWNER_EMAIL=you@example.com to receive the owner
 *      account's login email at a real address instead of the mock one.
 *   3. bun run scripts/seed.ts
 *
 * Safe to re-run against an empty project; NOT idempotent against a
 * partially-seeded one (it always inserts, never upserts) — if a run fails
 * partway through, easiest fix is to wipe the affected tables and retry.
 *
 * Known gaps (kept out of scope to bound this script):
 *   - document_links (task/request attachment associations) — not seeded.
 *   - storage_connections / project_storage_mappings / ai_action_logs — not
 *     seeded; these are per-user demo conveniences, not core business data.
 *   - project_share_links — not seeded; Client.shareLinks isn't wired into
 *     the data layer yet either (see src/lib/data/clients.ts).
 */
import { createClient } from "@supabase/supabase-js";
import { format, parse, isValid } from "date-fns";
import {
  users as mockUsers,
  clients as mockClients,
  projects as mockProjects,
  tasks as mockTasks,
  requests as mockRequests,
  documents as mockDocuments,
  channels as mockChannels,
  messages as mockMessages,
  timeEntries as mockTimeEntries,
} from "../src/lib/mock-data";
import { seedComments as mockComments } from "../src/lib/store";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL_OVERRIDE = process.env.SEED_OWNER_EMAIL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in your environment (add to .env.local).");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── date helpers (mirror src/lib/data/mappers.ts, direction reversed) ──────
function parseFlexible(value: string | undefined, fallbackYear = 2026): string | null {
  if (!value || value === "—") return null;
  const withYear = /,\s*\d{4}$/.test(value) ? value : `${value}, ${fallbackYear}`;
  for (const fmt of ["MMM d, yyyy", "MMM dd, yyyy", "yyyy-MM-dd"]) {
    const d = parse(withYear, fmt, new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }
  const native = new Date(value);
  return isValid(native) ? format(native, "yyyy-MM-dd") : null;
}

function parseMonthYear(value: string | undefined): string | null {
  if (!value) return null;
  const d = parse(value, "MMM yyyy", new Date());
  return isValid(d) ? format(d, "yyyy-MM-dd") : null;
}

// ── id maps: mock string id -> real Supabase uuid ───────────────────────────
const userIdMap = new Map<string, string>();
const clientIdMap = new Map<string, string>();
const projectIdMap = new Map<string, string>();
const taskIdMap = new Map<string, string>();
const requestIdMap = new Map<string, string>();

function must<T>(map: Map<string, T>, key: string, label: string): T {
  const v = map.get(key);
  if (v === undefined) throw new Error(`${label}: no mapping for mock id "${key}"`);
  return v;
}

async function seedClients() {
  console.log(`Seeding ${mockClients.length} clients...`);
  for (const c of mockClients) {
    const { data, error } = await admin
      .from("clients")
      .insert({
        name: c.name,
        industry: c.industry,
        sub_industry: c.subIndustry,
        logo_color: c.logoColor,
        logo_url: c.logoUrl,
        contact: c.contact,
        contact_email: c.contactEmail,
        contact_avatar: c.contactAvatar,
        contact_phone: c.contactPhone,
        contact_role: c.contactRole,
        status: c.status,
        retainer: c.retainer,
        since: parseMonthYear(c.since),
        health: c.health,
        website: c.website,
        phone: c.phone,
        business_email: c.businessEmail,
        timezone: c.timezone,
        address: c.address,
        zip_code: c.zipCode,
        country: c.country,
        state: c.state,
        city: c.city,
        description: c.description,
        preferred_contact_method: c.preferredContactMethod,
        working_hours: c.workingHours,
        preferred_meeting_times: c.preferredMeetingTimes,
        availability_notes: c.availabilityNotes,
        map_directions_link: c.mapDirectionsLink,
        notes: c.notes,
        currency: c.currency,
        tags: c.tags,
        additional_contacts: c.additionalContacts,
        social_links: c.socialLinks,
        shortcuts: c.shortcuts,
      })
      .select("id")
      .single();
    if (error) throw new Error(`client "${c.name}": ${error.message}`);
    clientIdMap.set(c.id, data.id);

    if (c.internalNotes) {
      const { error: privError } = await admin
        .from("client_private")
        .insert({ client_id: data.id, internal_notes: c.internalNotes });
      if (privError) throw new Error(`client_private "${c.name}": ${privError.message}`);
    }
  }
}

async function seedUsers() {
  console.log(`Seeding ${mockUsers.length} users (creates real Supabase Auth accounts)...`);
  for (const u of mockUsers) {
    const email = u.id === "u1" && OWNER_EMAIL_OVERRIDE ? OWNER_EMAIL_OVERRIDE : u.email;
    const isPasswordRole = u.role === "owner" || u.role === "manager";
    const password = isPasswordRole ? crypto.randomUUID() : undefined;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { name: u.name, role: u.role },
    });
    if (error) throw new Error(`auth user "${u.name}" <${email}>: ${error.message}`);
    const authId = data.user.id;
    userIdMap.set(u.id, authId);

    // handle_new_user() already created a bare profiles row — fill in the
    // rest, plus the client_id link for client-role contacts (matched by
    // email against Client.contactEmail).
    const linkedClient = u.role === "client" ? mockClients.find((c) => c.contactEmail === u.email) : undefined;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        title: u.title,
        status: u.status?.toLowerCase(),
        avatar: u.avatar,
        color: u.color,
        bio: u.bio,
        phone: u.phone,
        timezone: u.timezone,
        working_hours: u.workingHours,
        address: u.address,
        city: u.city,
        state: u.state,
        zip_code: u.zipCode,
        linkedin: u.linkedin,
        github: u.github,
        shortcuts: u.shortcuts ?? [],
        client_id: linkedClient ? clientIdMap.get(linkedClient.id) : null,
      })
      .eq("id", authId);
    if (profileError) throw new Error(`profile update "${u.name}": ${profileError.message}`);

    if (u.hourlyRate !== undefined || u.internalNotes || u.emergencyContact || u.memberShareToken) {
      const { error: privError } = await admin.from("profile_private").insert({
        user_id: authId,
        hourly_rate: u.hourlyRate,
        financial_type: u.financialType,
        financial_amount: u.financialAmount,
        emergency_contact: u.emergencyContact,
        internal_notes: u.internalNotes,
        member_share_token: u.memberShareToken,
      });
      if (privError) throw new Error(`profile_private "${u.name}": ${privError.message}`);
    }

    if (password) {
      console.log(`  ${u.role.padEnd(7)} ${email.padEnd(28)} temp password: ${password}`);
    } else {
      console.log(`  ${u.role.padEnd(7)} ${email.padEnd(28)} (magic-link only, no password set)`);
    }
  }
}

async function seedProjects() {
  console.log(`Seeding ${mockProjects.length} projects...`);
  for (const p of mockProjects) {
    const { data, error } = await admin
      .from("projects")
      .insert({
        client_id: must(clientIdMap, p.clientId, `project "${p.name}" clientId`),
        name: p.name,
        status: p.status,
        type: p.type,
        visibility: p.visibility,
        budget: p.budget,
        spent: p.spent,
        hours_estimate: p.hoursEstimate,
        hours_logged: p.hoursLogged,
        start_date: parseFlexible(p.startDate),
        end_date: parseFlexible(p.endDate),
        progress: p.progress,
        lead_id: userIdMap.get(p.lead) ?? null,
        description: p.description,
        accent: p.accent,
        notifications: p.notifications ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`project "${p.name}": ${error.message}`);
    projectIdMap.set(p.id, data.id);

    const memberRows = p.team
      .map((mockUid) => userIdMap.get(mockUid))
      .filter((v): v is string => Boolean(v))
      .map((user_id) => ({ project_id: data.id, user_id }));
    if (memberRows.length) {
      const { error: memberError } = await admin.from("project_members").insert(memberRows);
      if (memberError) throw new Error(`project_members "${p.name}": ${memberError.message}`);
    }
  }
}

async function seedTasks() {
  console.log(`Seeding ${mockTasks.length} tasks...`);
  for (const t of mockTasks) {
    const { data, error } = await admin
      .from("tasks")
      .insert({
        project_id: must(projectIdMap, t.projectId, `task "${t.title}" projectId`),
        title: t.title,
        note: t.note,
        stage: t.stage,
        priority: t.priority,
        progress: t.progress,
        start_date: parseFlexible(t.startDate),
        due_date: parseFlexible(t.dueDate),
        estimated_hours: t.estimatedHours,
        tags: t.tags ?? [],
        custom_fields: t.customFields ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`task "${t.title}": ${error.message}`);
    taskIdMap.set(t.id, data.id);

    const assigneeRows = t.assignees
      .map((mockUid) => userIdMap.get(mockUid))
      .filter((v): v is string => Boolean(v))
      .map((user_id) => ({ task_id: data.id, user_id }));
    if (assigneeRows.length) {
      const { error: e } = await admin.from("task_assignees").insert(assigneeRows);
      if (e) throw new Error(`task_assignees "${t.title}": ${e.message}`);
    }

    const followerRows = (t.followers ?? [])
      .map((mockUid) => userIdMap.get(mockUid))
      .filter((v): v is string => Boolean(v))
      .map((user_id) => ({ task_id: data.id, user_id }));
    if (followerRows.length) {
      const { error: e } = await admin.from("task_followers").insert(followerRows);
      if (e) throw new Error(`task_followers "${t.title}": ${e.message}`);
    }
  }
}

async function seedRequests() {
  console.log(`Seeding ${mockRequests.length} requests...`);
  for (const r of mockRequests) {
    const { data, error } = await admin
      .from("requests")
      .insert({
        client_id: must(clientIdMap, r.clientId, `request "${r.title}" clientId`),
        project_id: r.projectId ? projectIdMap.get(r.projectId) ?? null : null,
        type: r.type,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        estimated_hours: r.estimatedHours,
        submitted_by: must(userIdMap, r.submittedBy, `request "${r.title}" submittedBy`),
      })
      .select("id")
      .single();
    if (error) throw new Error(`request "${r.title}": ${error.message}`);
    requestIdMap.set(r.id, data.id);
  }
}

async function seedDocuments() {
  console.log(`Seeding ${mockDocuments.length} documents...`);
  const rows = mockDocuments.map((d) => ({
    project_id: must(projectIdMap, d.projectId, `document "${d.name}" projectId`),
    name: d.name,
    folder: d.folder,
    size_bytes: null,
    preview_url: d.previewUrl,
    shared: d.shared,
    uploaded_by: userIdMap.get(d.uploadedBy) ?? null,
  }));
  const { error } = await admin.from("documents").insert(rows);
  if (error) throw new Error(`documents: ${error.message}`);
}

async function seedTimeEntries() {
  console.log(`Seeding ${mockTimeEntries.length} time entries...`);
  const rows = mockTimeEntries
    .filter((te) => userIdMap.has(te.userId) && projectIdMap.has(te.projectId))
    .map((te) => ({
      user_id: must(userIdMap, te.userId, `time entry ${te.id} userId`),
      project_id: must(projectIdMap, te.projectId, `time entry ${te.id} projectId`),
      task_id: te.taskId ? taskIdMap.get(te.taskId) ?? null : null,
      date: te.date,
      hours: te.hours,
      note: te.note,
      billable: te.billable,
    }));
  // Chunk — a few hundred rows in one INSERT is fine, but keep this safe if
  // mock-data.ts grows.
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await admin.from("time_entries").insert(rows.slice(i, i + 500));
    if (error) throw new Error(`time_entries: ${error.message}`);
  }
}

function resolveThread(mockThreadId: string): { thread_type: "project" | "task" | "request"; thread_id: string } | null {
  if (taskIdMap.has(mockThreadId)) return { thread_type: "task", thread_id: taskIdMap.get(mockThreadId)! };
  if (projectIdMap.has(mockThreadId)) return { thread_type: "project", thread_id: projectIdMap.get(mockThreadId)! };
  if (requestIdMap.has(mockThreadId)) return { thread_type: "request", thread_id: requestIdMap.get(mockThreadId)! };
  return null;
}

async function seedComments() {
  console.log(`Seeding ${mockComments.length} comments...`);
  const rows = mockComments
    .map((c) => {
      const thread = resolveThread(c.threadId);
      const author = userIdMap.get(c.author);
      if (!thread || !author) return null;
      return {
        thread_type: thread.thread_type,
        thread_id: thread.thread_id,
        author,
        body: c.body,
        visibility: c.visibility,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length) {
    const { error } = await admin.from("comments").insert(rows);
    if (error) throw new Error(`comments: ${error.message}`);
  }
}

async function seedChannelsAndMessages() {
  console.log(`Seeding ${mockChannels.length} channels + ${mockMessages.length} messages...`);
  const channelIdMap = new Map<string, string>();
  for (const ch of mockChannels) {
    const { data, error } = await admin
      .from("channels")
      .insert({
        name: ch.name,
        project_id: ch.projectId ? projectIdMap.get(ch.projectId) ?? null : null,
        client_id: ch.clientId ? clientIdMap.get(ch.clientId) ?? null : null,
        last_message: ch.lastMessage,
        last_at: null, // ch.lastAt is a relative label ("1h", "Yest") — not a real timestamp
      })
      .select("id")
      .single();
    if (error) throw new Error(`channel "${ch.name}": ${error.message}`);
    channelIdMap.set(ch.id, data.id);
  }

  const messageRows = mockMessages
    .map((m) => {
      const channel_id = channelIdMap.get(m.channelId);
      const author = userIdMap.get(m.author);
      if (!channel_id || !author) return null;
      return { channel_id, author, body: m.body, visibility: m.visibility };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (messageRows.length) {
    const { error } = await admin.from("messages").insert(messageRows);
    if (error) throw new Error(`messages: ${error.message}`);
  }
}

async function main() {
  console.log(`Seeding ${SUPABASE_URL} ...\n`);
  await seedClients();
  await seedUsers();
  await seedProjects();
  await seedTasks();
  await seedRequests();
  await seedDocuments();
  await seedTimeEntries();
  await seedComments();
  await seedChannelsAndMessages();
  console.log("\nDone. Password-role accounts are listed above — reset or note those before sharing this project.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
