/**
 * Data-access layer for `tasks` + `task_assignees` + `task_followers`,
 * backed by Supabase. Same pattern as clients.ts/projects.ts.
 *
 * Task.dueDate is a special case: the app displays it with no year ("Jun
 * 14", see src/lib/dates.ts formatDateShort) even though it's a real `date`
 * column here — see displayShortToDbDate/dbDateToDisplayShort in mappers.ts.
 * Task.startDate, by contrast, is already stored/passed as a raw ISO string
 * everywhere in the app (NewTaskModal passes it straight from an
 * `<input type="date">`), so it round-trips with no conversion needed.
 *
 * Task.attachments is left at 0 — it should count document_links rows, but
 * documents/document_links aren't wired into the data layer yet either (see
 * src/lib/data/documents.ts's TODO). Task.comments is a real live count
 * against `comments`, which is already seeded and RLS-protected.
 */
import { supabase } from "@/lib/supabase/client";
import type { Task, TaskStage, Priority } from "@/lib/mock-data";
import { compact, dbDateToDisplayShort, displayShortToDbDate } from "./mappers";

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  note: string | null;
  stage: TaskStage;
  priority: Priority;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  tags: string[] | null;
  custom_fields: Task["customFields"] | null;
  created_at: string;
  updated_at: string | null;
  task_assignees?: { user_id: string }[];
  task_followers?: { user_id: string }[];
};

function mapRow(row: TaskRow, commentCount = 0): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    note: row.note ?? "",
    stage: row.stage,
    priority: row.priority,
    progress: row.progress,
    dueDate: dbDateToDisplayShort(row.due_date),
    assignees: (row.task_assignees ?? []).map((a) => a.user_id),
    attachments: 0,
    comments: commentCount,
    startDate: row.start_date ?? undefined,
    tags: row.tags ?? undefined,
    followers: (row.task_followers ?? []).map((f) => f.user_id),
    estimatedHours: row.estimated_hours ?? undefined,
    customFields: row.custom_fields ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapToRow(patch: Partial<Task>): Record<string, unknown> {
  return compact({
    project_id: patch.projectId,
    title: patch.title,
    note: patch.note,
    stage: patch.stage,
    priority: patch.priority,
    progress: patch.progress,
    start_date: patch.startDate,
    due_date: patch.dueDate !== undefined ? displayShortToDbDate(patch.dueDate) : undefined,
    estimated_hours: patch.estimatedHours,
    tags: patch.tags,
    custom_fields: patch.customFields,
  });
}

const SELECT_WITH_RELATIONS = "*, task_assignees(user_id), task_followers(user_id)";

async function commentCountsByTask(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from("comments").select("thread_id").eq("thread_type", "task");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = (row as { thread_id: string }).thread_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function syncJoinTable(table: "task_assignees" | "task_followers", taskId: string, userIds: string[] | undefined) {
  if (userIds === undefined) return;
  const { error: deleteError } = await supabase.from(table).delete().eq("task_id", taskId);
  if (deleteError) throw deleteError;
  if (userIds.length === 0) return;
  const { error: insertError } = await supabase.from(table).insert(userIds.map((user_id) => ({ task_id: taskId, user_id })));
  if (insertError) throw insertError;
}

export async function listTasks(): Promise<Task[]> {
  const [{ data, error }, commentCounts] = await Promise.all([
    supabase.from("tasks").select(SELECT_WITH_RELATIONS).order("created_at", { ascending: false }),
    commentCountsByTask(),
  ]);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as TaskRow, commentCounts.get((r as TaskRow).id) ?? 0));
}

export async function createTaskRecord(input: Partial<Task> & Pick<Task, "projectId" | "title">): Promise<Task> {
  const { assignees, followers, ...rest } = input;
  const row = {
    ...mapToRow(rest),
    project_id: input.projectId,
    title: input.title,
    note: input.note ?? "",
    stage: input.stage ?? "todo",
    priority: input.priority ?? "medium",
    progress: input.progress ?? 0,
    due_date: displayShortToDbDate(input.dueDate),
    start_date: input.startDate || null,
    estimated_hours: input.estimatedHours ?? 0,
    tags: input.tags ?? [],
    custom_fields: input.customFields ?? {},
  };
  const { data, error } = await supabase.from("tasks").insert(row).select("*").single();
  if (error) throw error;
  const created = data as TaskRow;
  await Promise.all([
    syncJoinTable("task_assignees", created.id, assignees ?? []),
    syncJoinTable("task_followers", created.id, followers ?? []),
  ]);
  return mapRow({
    ...created,
    task_assignees: (assignees ?? []).map((user_id) => ({ user_id })),
    task_followers: (followers ?? []).map((user_id) => ({ user_id })),
  });
}

export async function updateTaskRecord(id: string, patch: Partial<Task>): Promise<void> {
  const { assignees, followers, ...rest } = patch;
  const row = mapToRow(rest);
  if (Object.keys(row).length > 0) {
    row.updated_at = new Date().toISOString();
    const { error } = await supabase.from("tasks").update(row).eq("id", id);
    if (error) throw error;
  }
  await Promise.all([syncJoinTable("task_assignees", id, assignees), syncJoinTable("task_followers", id, followers)]);
}

export async function deleteTaskRecord(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function setTaskStageRecord(id: string, stage: TaskStage, progress?: number): Promise<void> {
  const row: Record<string, unknown> = { stage, updated_at: new Date().toISOString() };
  if (progress !== undefined) row.progress = progress;
  const { error } = await supabase.from("tasks").update(row).eq("id", id);
  if (error) throw error;
}

export async function setTaskPriorityRecord(id: string, priority: Priority): Promise<void> {
  const { error } = await supabase.from("tasks").update({ priority, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function assignTaskRecord(id: string, assignees: string[]): Promise<void> {
  await syncJoinTable("task_assignees", id, assignees);
}
