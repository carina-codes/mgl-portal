/**
 * Data-access layer for `projects` + `project_members`, backed by Supabase.
 * Same pattern as clients.ts: map DB rows onto the existing camelCase
 * `Project` type so store.ts and consuming pages don't change.
 *
 * `Project.team` (string[]) is really the `project_members` join table —
 * fetched via Supabase's embedded-resource select and flattened back into
 * an array here so nothing downstream has to know it's relational now.
 */
import { supabase } from "@/lib/supabase/client";
import type { Project, ProjectStatus } from "@/lib/mock-data";
import { compact, dbDateToDisplay, displayToDbDate } from "./mappers";

type ProjectRow = {
  id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  type: Project["type"];
  visibility: Project["visibility"] | null;
  budget: number;
  spent: number;
  hours_estimate: number;
  hours_logged: number;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  lead_id: string | null;
  description: string | null;
  accent: Project["accent"] | null;
  notifications: Project["notifications"] | null;
  created_at: string;
  updated_at: string | null;
  project_members?: { user_id: string }[];
};

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    status: row.status,
    type: row.type,
    budget: Number(row.budget),
    spent: Number(row.spent),
    hoursEstimate: Number(row.hours_estimate),
    hoursLogged: Number(row.hours_logged),
    startDate: dbDateToDisplay(row.start_date),
    endDate: dbDateToDisplay(row.end_date),
    progress: row.progress,
    team: (row.project_members ?? []).map((m) => m.user_id),
    lead: row.lead_id ?? "",
    description: row.description ?? "",
    accent: row.accent ?? "todo",
    visibility: row.visibility ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    notifications: row.notifications ?? undefined,
  };
}

function mapToRow(patch: Partial<Project>): Record<string, unknown> {
  return compact({
    client_id: patch.clientId,
    name: patch.name,
    status: patch.status,
    type: patch.type,
    visibility: patch.visibility,
    budget: patch.budget,
    spent: patch.spent,
    hours_estimate: patch.hoursEstimate,
    hours_logged: patch.hoursLogged,
    start_date: patch.startDate !== undefined ? displayToDbDate(patch.startDate) : undefined,
    end_date: patch.endDate !== undefined ? displayToDbDate(patch.endDate) : undefined,
    progress: patch.progress,
    lead_id: patch.lead || undefined,
    description: patch.description,
    accent: patch.accent,
    notifications: patch.notifications,
  });
}

const SELECT_WITH_MEMBERS = "*, project_members(user_id)";

async function syncTeam(projectId: string, team: string[] | undefined) {
  if (team === undefined) return;
  const { error: deleteError } = await supabase.from("project_members").delete().eq("project_id", projectId);
  if (deleteError) throw deleteError;
  if (team.length === 0) return;
  const { error: insertError } = await supabase
    .from("project_members")
    .insert(team.map((userId) => ({ project_id: projectId, user_id: userId })));
  if (insertError) throw insertError;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(SELECT_WITH_MEMBERS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as ProjectRow));
}

export async function createProjectRecord(
  input: Partial<Project> & Pick<Project, "name" | "clientId">
): Promise<Project> {
  const { team, ...rest } = input;
  const row = {
    ...mapToRow(rest),
    client_id: input.clientId,
    name: input.name,
    status: input.status ?? "planning",
    type: input.type ?? "fixed",
    budget: input.budget ?? 0,
    hours_estimate: input.hoursEstimate ?? 0,
    start_date: displayToDbDate(input.startDate),
    end_date: displayToDbDate(input.endDate),
    lead_id: input.lead || team?.[0] || undefined,
    description: input.description ?? "",
    accent: input.accent ?? "progress",
  };
  const { data, error } = await supabase.from("projects").insert(row).select("*").single();
  if (error) throw error;
  const created = data as ProjectRow;
  await syncTeam(created.id, team ?? []);
  return mapRow({ ...created, project_members: (team ?? []).map((user_id) => ({ user_id })) });
}

export async function updateProjectRecord(id: string, patch: Partial<Project>): Promise<void> {
  const { team, ...rest } = patch;
  const row = mapToRow(rest);
  if (Object.keys(row).length > 0) {
    row.updated_at = new Date().toISOString();
    const { error } = await supabase.from("projects").update(row).eq("id", id);
    if (error) throw error;
  }
  await syncTeam(id, team);
}

/** Mirrors the store's existing (slightly inconsistent) behavior — see the
 * `project_status` enum comment in the schema migration for why "on_hold"
 * is accepted even though it's outside the app's declared ProjectStatus type. */
export async function archiveProjectRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "on_hold", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Cascades to that project's tasks + documents via FK ON DELETE CASCADE. */
export async function deleteProjectRecord(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function setProjectStatusRecord(id: string, status: ProjectStatus): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateProjectRecord(id: string): Promise<Project> {
  const { data, error } = await supabase.from("projects").select(SELECT_WITH_MEMBERS).eq("id", id).single();
  if (error) throw error;
  const original = mapRow(data as ProjectRow);
  return createProjectRecord({
    ...original,
    name: `${original.name} (Copy)`,
    status: "planning",
    progress: 0,
    spent: 0,
    hoursLogged: 0,
  });
}
