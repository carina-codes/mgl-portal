/**
 * Data-access layer for `requests`, backed by Supabase. Same pattern as
 * clients.ts/projects.ts/tasks.ts.
 */
import { supabase } from "@/lib/supabase/client";
import type { ClientRequest, RequestStatus } from "@/lib/mock-data";
import { compact, timestampToRelative } from "./mappers";

type RequestRow = {
  id: string;
  client_id: string;
  project_id: string | null;
  type: ClientRequest["type"];
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: ClientRequest["priority"];
  estimated_hours: number | null;
  submitted_by: string;
  submitted_at: string;
};

function mapRow(row: RequestRow): ClientRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id ?? undefined,
    type: row.type,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    submittedAt: timestampToRelative(row.submitted_at) ?? row.submitted_at,
    submittedBy: row.submitted_by,
    estimatedHours: row.estimated_hours ?? undefined,
    priority: row.priority,
  };
}

function mapToRow(patch: Partial<ClientRequest>): Record<string, unknown> {
  return compact({
    client_id: patch.clientId,
    project_id: patch.projectId,
    type: patch.type,
    title: patch.title,
    description: patch.description,
    status: patch.status,
    priority: patch.priority,
    estimated_hours: patch.estimatedHours,
    submitted_by: patch.submittedBy,
  });
}

export async function listRequests(): Promise<ClientRequest[]> {
  const { data, error } = await supabase.from("requests").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as RequestRow));
}

export async function createRequestRecord(
  input: Partial<ClientRequest> & Pick<ClientRequest, "clientId" | "title" | "type">
): Promise<ClientRequest> {
  const row = {
    ...mapToRow(input),
    client_id: input.clientId,
    title: input.title,
    type: input.type,
    description: input.description ?? "",
    status: input.status ?? "submitted",
    priority: input.priority ?? "medium",
    submitted_by: input.submittedBy,
  };
  const { data, error } = await supabase.from("requests").insert(row).select("*").single();
  if (error) throw error;
  return mapRow(data as RequestRow);
}

export async function updateRequestRecord(id: string, patch: Partial<ClientRequest>): Promise<void> {
  const row = mapToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("requests").update(row).eq("id", id);
  if (error) throw error;
}

export async function setRequestStatusRecord(id: string, status: RequestStatus): Promise<void> {
  const { error } = await supabase.from("requests").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Cascades to comments/document_links pointed at this request via
 * comments.thread_id / document_links.thread_id — those aren't FK-enforced
 * (thread_type/thread_id is a polymorphic pair, see schema migration), so
 * no DB cascade actually fires; callers still need to clean those up. */
export async function deleteRequestRecord(id: string): Promise<void> {
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw error;
}
