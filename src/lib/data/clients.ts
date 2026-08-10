/**
 * Data-access layer for `clients`, backed by Supabase. Maps the DB's
 * snake_case rows onto the app's existing camelCase `Client` type
 * (src/lib/mock-data.ts) so store.ts and every consuming page keep working
 * unchanged — only the store's internals (this file) know about Supabase.
 *
 * `Client.projects` / `openRequests` / `hoursMonth` are NOT stored columns
 * (see supabase/migrations/20260811000000_init_schema.sql) — they're
 * computed live from the `client_stats` view so they can't drift the way a
 * manually-maintained counter would.
 *
 * `Client.internalNotes` lives in `client_private` (owner/manager only per
 * RLS) and `Client.shareLinks` lives in the relational `project_share_links`
 * table — neither is wired up yet in this pass; both come back as
 * empty/undefined until a follow-up migrates those pieces too.
 */
import { supabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/mock-data";
import { compact, dbDateToMonthYear, monthYearToDbDate, timestampToRelative } from "./mappers";

type ClientRow = {
  id: string;
  name: string;
  industry: string;
  sub_industry: string | null;
  logo_color: string;
  logo_url: string | null;
  contact: string;
  contact_email: string;
  contact_avatar: string | null;
  contact_phone: string | null;
  contact_role: string | null;
  status: Client["status"];
  retainer: string | null;
  since: string | null;
  health: Client["health"];
  website: string | null;
  phone: string | null;
  business_email: string | null;
  timezone: string | null;
  address: string | null;
  zip_code: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  description: string | null;
  preferred_contact_method: Client["preferredContactMethod"] | null;
  working_hours: string | null;
  preferred_meeting_times: string | null;
  availability_notes: string | null;
  map_directions_link: string | null;
  notes: string | null;
  currency: string | null;
  tags: string[] | null;
  additional_contacts: Client["additionalContacts"] | null;
  social_links: Client["socialLinks"] | null;
  shortcuts: Client["shortcuts"] | null;
  last_activity_at: string | null;
};

type ClientStatsRow = {
  client_id: string;
  active_projects: number | null;
  open_requests: number | null;
  hours_this_month: number | null;
};

function mapRow(row: ClientRow, stats?: ClientStatsRow): Client {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    subIndustry: row.sub_industry ?? undefined,
    logoColor: row.logo_color,
    contact: row.contact,
    contactEmail: row.contact_email,
    contactAvatar: row.contact_avatar ?? undefined,
    status: row.status,
    retainer: row.retainer ?? "",
    since: dbDateToMonthYear(row.since),
    projects: stats?.active_projects ?? 0,
    openRequests: stats?.open_requests ?? 0,
    hoursMonth: stats?.hours_this_month ?? 0,
    health: row.health,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    businessEmail: row.business_email ?? undefined,
    timezone: row.timezone ?? undefined,
    address: row.address ?? undefined,
    zipCode: row.zip_code ?? undefined,
    description: row.description ?? undefined,
    country: row.country ?? undefined,
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    contactRole: row.contact_role ?? undefined,
    workingHours: row.working_hours ?? undefined,
    preferredMeetingTimes: row.preferred_meeting_times ?? undefined,
    availabilityNotes: row.availability_notes ?? undefined,
    mapDirectionsLink: row.map_directions_link ?? undefined,
    notes: row.notes ?? undefined,
    internalNotes: undefined,
    lastActivity: timestampToRelative(row.last_activity_at),
    currency: row.currency ?? undefined,
    tags: row.tags ?? undefined,
    additionalContacts: row.additional_contacts ?? undefined,
    socialLinks: row.social_links ?? undefined,
    shareLinks: [],
    logoUrl: row.logo_url ?? undefined,
    shortcuts: row.shortcuts ?? undefined,
  };
}

function mapToRow(patch: Partial<Client>): Record<string, unknown> {
  return compact({
    name: patch.name,
    industry: patch.industry,
    sub_industry: patch.subIndustry,
    logo_color: patch.logoColor,
    logo_url: patch.logoUrl,
    contact: patch.contact,
    contact_email: patch.contactEmail,
    contact_avatar: patch.contactAvatar,
    contact_phone: patch.contactPhone,
    contact_role: patch.contactRole,
    status: patch.status,
    retainer: patch.retainer,
    since: patch.since !== undefined ? monthYearToDbDate(patch.since) : undefined,
    health: patch.health,
    website: patch.website,
    phone: patch.phone,
    business_email: patch.businessEmail,
    timezone: patch.timezone,
    address: patch.address,
    zip_code: patch.zipCode,
    country: patch.country,
    state: patch.state,
    city: patch.city,
    description: patch.description,
    preferred_contact_method: patch.preferredContactMethod,
    working_hours: patch.workingHours,
    preferred_meeting_times: patch.preferredMeetingTimes,
    availability_notes: patch.availabilityNotes,
    map_directions_link: patch.mapDirectionsLink,
    notes: patch.notes,
    currency: patch.currency,
    tags: patch.tags,
    additional_contacts: patch.additionalContacts,
    social_links: patch.socialLinks,
    shortcuts: patch.shortcuts,
  });
}

export async function listClients(): Promise<Client[]> {
  const [{ data: rows, error }, { data: stats, error: statsError }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("client_stats").select("*"),
  ]);
  if (error) throw error;
  if (statsError) throw statsError;

  const statsByClient = new Map((stats ?? []).map((s) => [(s as ClientStatsRow).client_id, s as ClientStatsRow]));
  return (rows ?? []).map((r) => mapRow(r as ClientRow, statsByClient.get((r as ClientRow).id)));
}

export async function createClientRecord(
  input: Partial<Client> & Pick<Client, "name" | "industry" | "contact" | "contactEmail">
): Promise<Client> {
  const row = {
    ...mapToRow(input),
    name: input.name,
    industry: input.industry,
    contact: input.contact,
    contact_email: input.contactEmail,
  };
  const { data, error } = await supabase.from("clients").insert(row).select("*").single();
  if (error) throw error;
  return mapRow(data as ClientRow);
}

export async function updateClientRecord(id: string, patch: Partial<Client>): Promise<void> {
  const row = mapToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("clients").update(row).eq("id", id);
  if (error) throw error;
}

export async function archiveClientRecord(id: string): Promise<void> {
  const { error } = await supabase.from("clients").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}

/** Cascades to that client's projects + requests via FK ON DELETE CASCADE. */
export async function deleteClientRecord(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
