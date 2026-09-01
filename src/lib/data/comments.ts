/**
 * Data-access layer for `comments`, backed by Supabase. Same pattern as
 * clients.ts/projects.ts/tasks.ts/requests.ts/documents.ts/time-entries.ts.
 *
 * The app's Comment.threadId is a single polymorphic id (a project, task, or
 * request id); the DB models that explicitly as (thread_type, thread_id).
 * Callers must resolve the type themselves (store.ts does this by checking
 * its own tasks/requests/projects slices) since this layer has no visibility
 * into the rest of the store.
 */
import { supabase } from "@/lib/supabase/client";
import type { Comment } from "@/lib/mock-data";
import { compact, timestampToRelative } from "./mappers";

export type ThreadType = "project" | "task" | "request";

type CommentRow = {
  id: string;
  thread_type: ThreadType;
  thread_id: string;
  author: string;
  body: string;
  visibility: Comment["visibility"];
  created_at: string;
  attachments: string[] | null;
};

function mapRow(row: CommentRow): Comment {
  return {
    id: row.id,
    threadId: row.thread_id,
    author: row.author,
    body: row.body,
    createdAt: timestampToRelative(row.created_at) ?? row.created_at,
    visibility: row.visibility,
    attachments: row.attachments ?? [],
  };
}

export async function listComments(): Promise<Comment[]> {
  const { data, error } = await supabase.from("comments").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => mapRow(c as CommentRow));
}

export async function createCommentRecord(
  input: Partial<Comment> & Pick<Comment, "threadId" | "author" | "body" | "visibility"> & { threadType: ThreadType }
): Promise<Comment> {
  const row = compact({
    thread_type: input.threadType,
    thread_id: input.threadId,
    author: input.author,
    body: input.body,
    visibility: input.visibility,
    attachments: input.attachments ?? [],
  });
  const { data, error } = await supabase.from("comments").insert(row).select("*").single();
  if (error) throw error;
  return mapRow(data as CommentRow);
}
