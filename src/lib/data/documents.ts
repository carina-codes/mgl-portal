/**
 * Data-access layer for `documents`, backed by Supabase. Same pattern as
 * clients.ts/projects.ts/tasks.ts/requests.ts.
 *
 * Folders aren't a real table — the app derives them from the distinct
 * `folder` values on documents for a project (see createFolder/renameFolder/
 * deleteFolder below, which mirror the mock store's placeholder-doc trick).
 */
import { supabase } from "@/lib/supabase/client";
import type { Document } from "@/lib/mock-data";
import { bytesToSizeString, compact, sizeStringToBytes, timestampToRelative } from "./mappers";

type DocumentRow = {
  id: string;
  project_id: string;
  name: string;
  folder: string;
  storage_path: string | null;
  size_bytes: number | null;
  preview_url: string | null;
  shared: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
};

function mapRow(row: DocumentRow): Document {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    folder: row.folder,
    size: bytesToSizeString(row.size_bytes),
    uploadedBy: row.uploaded_by ?? "",
    uploadedAt: timestampToRelative(row.uploaded_at) ?? row.uploaded_at,
    shared: row.shared,
    previewUrl: row.preview_url ?? undefined,
  };
}

function mapToRow(patch: Partial<Document>): Record<string, unknown> {
  return compact({
    project_id: patch.projectId,
    name: patch.name,
    folder: patch.folder,
    size_bytes: patch.size !== undefined ? sizeStringToBytes(patch.size) : undefined,
    preview_url: patch.previewUrl,
    shared: patch.shared,
    uploaded_by: patch.uploadedBy,
  });
}

export async function listDocuments(): Promise<Document[]> {
  const { data, error } = await supabase.from("documents").select("*").order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => mapRow(d as DocumentRow));
}

export async function uploadDocumentRecord(
  input: Partial<Document> & Pick<Document, "projectId" | "name" | "folder">
): Promise<Document> {
  const row = {
    ...mapToRow(input),
    project_id: input.projectId,
    name: input.name,
    folder: input.folder,
    shared: input.shared ?? false,
  };
  const { data, error } = await supabase.from("documents").insert(row).select("*").single();
  if (error) throw error;
  return mapRow(data as DocumentRow);
}

export async function renameDocumentRecord(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("documents").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function moveDocumentRecord(id: string, folder: string): Promise<void> {
  const { error } = await supabase.from("documents").update({ folder }).eq("id", id);
  if (error) throw error;
}

export async function deleteDocumentRecord(id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function setDocumentSharedRecord(id: string, shared: boolean): Promise<void> {
  const { error } = await supabase.from("documents").update({ shared }).eq("id", id);
  if (error) throw error;
}

/** Folders are materialized as a hidden ".keep" placeholder document, same trick the mock store used. */
export async function createFolderRecord(projectId: string, name: string): Promise<Document> {
  return uploadDocumentRecord({
    projectId,
    folder: name,
    name: ".keep",
    size: "0 B",
    shared: false,
  });
}

export async function renameFolderRecord(projectId: string | undefined, oldName: string, newName: string): Promise<void> {
  let query = supabase.from("documents").update({ folder: newName }).eq("folder", oldName);
  if (projectId) query = query.eq("project_id", projectId);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteFolderRecord(projectId: string | undefined, folderName: string): Promise<void> {
  let query = supabase.from("documents").delete().eq("folder", folderName);
  if (projectId) query = query.eq("project_id", projectId);
  const { error } = await query;
  if (error) throw error;
}
