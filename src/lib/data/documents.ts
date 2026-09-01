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
    storagePath: row.storage_path ?? undefined,
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
    storage_path: patch.storagePath,
  });
}

/** Storage object path for a given project/document/filename — kept in one
 * place since both the upload and the RLS policies (see migration
 * 20260901161200_document_storage.sql) depend on this exact shape:
 * {project_id}/{document_id}/{filename}. */
function storageObjectPath(projectId: string, documentId: string, filename: string): string {
  return `${projectId}/${documentId}/${filename}`;
}

export async function listDocuments(): Promise<Document[]> {
  const { data, error } = await supabase.from("documents").select("*").order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => mapRow(d as DocumentRow));
}

/**
 * Inserts the metadata row and, when a real File is given, uploads its
 * bytes to the `documents` Storage bucket and links the row to it via
 * storage_path. The row goes in first because the object's path includes
 * the document's id (see storageObjectPath) — if the upload itself fails,
 * the now-orphaned metadata row is deleted rather than left pointing at a
 * file that was never actually stored.
 *
 * Callers that don't pass a file (e.g. createFolderRecord's ".keep"
 * placeholder) get exactly the old metadata-only behavior.
 */
export async function uploadDocumentRecord(
  input: Partial<Document> & Pick<Document, "projectId" | "name" | "folder">,
  file?: File
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
  const doc = mapRow(data as DocumentRow);
  if (!file) return doc;

  const path = storageObjectPath(input.projectId, doc.id, file.name);
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
  if (uploadError) {
    // Best-effort cleanup — don't leave a metadata row for a file that
    // isn't actually there. If this also fails, the upload error is still
    // what the user sees; an orphaned row can be cleaned up later.
    await supabase.from("documents").delete().eq("id", doc.id);
    throw uploadError;
  }

  const { data: updated, error: updateError } = await supabase
    .from("documents")
    .update({ storage_path: path, size_bytes: file.size })
    .eq("id", doc.id)
    .select("*")
    .single();
  if (updateError) throw updateError;
  return mapRow(updated as DocumentRow);
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
  const { data: existing } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  const storagePath = (existing as { storage_path: string | null } | null)?.storage_path;

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;

  // Best-effort — the row is already gone (that's the part the user is
  // waiting on), so a storage cleanup failure here shouldn't surface as a
  // failed delete. Worst case it leaves an unreferenced object behind.
  if (storagePath) {
    await supabase.storage.from("documents").remove([storagePath]).catch((e) => {
      console.error("Failed to remove storage object for deleted document", id, e);
    });
  }
}

/** Signed, time-limited URL for downloading/previewing a private-bucket
 * file. Access is still gated by the "documents bucket: member select" RLS
 * policy — this doesn't bypass it, it's just how a browser holding only
 * the anon key reads a private object at all. */
export async function getDocumentDownloadUrl(storagePath: string, expiresInSeconds = 60): Promise<string> {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
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
