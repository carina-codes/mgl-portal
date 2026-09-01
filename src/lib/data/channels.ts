/**
 * Data-access layer for `channels`, backed by Supabase.
 *
 * Read-only for now: the app's actual message content lives in `comments`
 * (see comments.ts) — the mock `channels`/`messages` tables only ever
 * powered the channel-list sidebar (name + unread badge) and were never
 * wired to real message sends even in the mock store. `unread` has no real
 * source of truth (channel_reads exists in the schema but nothing writes
 * timestamps to it yet), so it's intentionally always 0 here rather than
 * faking a number — same call as leaving storageConnections/aiActions mock.
 */
import { supabase } from "@/lib/supabase/client";
import type { Channel } from "@/lib/mock-data";

type ChannelRow = {
  id: string;
  name: string;
  project_id: string | null;
  client_id: string | null;
  last_message: string | null;
  last_at: string | null;
};

function mapRow(row: ChannelRow): Channel {
  return {
    id: row.id,
    name: row.name,
    projectId: row.project_id ?? undefined,
    clientId: row.client_id ?? undefined,
    unread: 0,
    lastMessage: row.last_message ?? "",
    lastAt: row.last_at ?? "",
  };
}

export async function listChannels(): Promise<Channel[]> {
  const { data, error } = await supabase.from("channels").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map((c) => mapRow(c as ChannelRow));
}
