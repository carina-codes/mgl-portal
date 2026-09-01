/**
 * Data-access layer for `time_entries`, backed by Supabase. Same pattern as
 * clients.ts/projects.ts/tasks.ts/requests.ts/documents.ts.
 *
 * TimeEntry.date is stored app-wide as a plain "yyyy-MM-dd" string, which
 * matches Postgres `date` column output exactly — no mapper needed.
 */
import { supabase } from "@/lib/supabase/client";
import type { TimeEntry } from "@/lib/mock-data";
import { compact } from "./mappers";

type TimeEntryRow = {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  date: string;
  hours: number;
  note: string | null;
  billable: boolean;
};

function mapRow(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    taskId: row.task_id ?? undefined,
    date: row.date,
    hours: Number(row.hours),
    note: row.note ?? "",
    billable: row.billable,
  };
}

function mapToRow(patch: Partial<TimeEntry>): Record<string, unknown> {
  return compact({
    user_id: patch.userId,
    project_id: patch.projectId,
    task_id: patch.taskId,
    date: patch.date,
    hours: patch.hours,
    note: patch.note,
    billable: patch.billable,
  });
}

export async function listTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from("time_entries").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => mapRow(t as TimeEntryRow));
}

export async function logTimeRecord(
  input: Partial<TimeEntry> & Pick<TimeEntry, "userId" | "projectId" | "hours" | "date">
): Promise<TimeEntry> {
  const row = {
    ...mapToRow(input),
    user_id: input.userId,
    project_id: input.projectId,
    hours: input.hours,
    date: input.date,
    billable: input.billable ?? true,
  };
  const { data, error } = await supabase.from("time_entries").insert(row).select("*").single();
  if (error) throw error;
  return mapRow(data as TimeEntryRow);
}

export async function updateTimeEntryRecord(id: string, patch: Partial<TimeEntry>): Promise<void> {
  const row = mapToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("time_entries").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTimeEntryRecord(id: string): Promise<void> {
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw error;
}
