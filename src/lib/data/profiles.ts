/**
 * Data-access layer for `profiles` + `profile_private`, backed by Supabase.
 * Same pattern as clients.ts/projects.ts: map DB rows onto the existing
 * camelCase `User` type so store.ts and consuming pages don't change.
 *
 * Important constraint: profiles.id is a foreign key to auth.users(id), and
 * this app only ever holds the anon key in the browser (output: "export" —
 * no server, so no service-role admin API access here). That shapes two
 * things below:
 *
 *   - createProfileRecord() can't directly INSERT a profiles row for a new
 *     team member the way createClientRecord() inserts a clients row —
 *     there's no auth.users row to point at yet. Instead it invites the
 *     person via a magic link (supabase.auth.signInWithOtp with
 *     shouldCreateUser: true), passing name/role as user metadata so the
 *     handle_new_user() trigger (see migration 1) creates a correctly
 *     populated profile immediately — before they've even clicked the link.
 *   - deleteProfileRecord() can only delete the `profiles` row, not the
 *     underlying auth.users account (that needs the admin API + service
 *     role key). The route guard in (app)/layout.tsx treats "authenticated
 *     but no profile" as unauthorized, so this still fully revokes access —
 *     it just leaves an orphaned auth user Supabase's side, which currently
 *     needs cleaning up manually (dashboard, or a script like scripts/seed.ts
 *     using the service role key) rather than from the app itself.
 */
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/lib/mock-data";

type ProfileRow = {
  id: string;
  client_id: string | null;
  name: string;
  email: string;
  role: User["role"];
  title: string | null;
  status: "available" | "busy" | null;
  avatar: string | null;
  color: string;
  bio: string | null;
  phone: string | null;
  timezone: string | null;
  working_hours: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  linkedin: string | null;
  github: string | null;
  shortcuts: User["shortcuts"] | null;
};

type ProfilePrivateRow = {
  user_id: string;
  hourly_rate: number | null;
  financial_type: string | null;
  financial_amount: number | null;
  emergency_contact: User["emergencyContact"] | null;
  internal_notes: string | null;
  member_share_token: string | null;
};

const STATUS_TO_DB: Record<NonNullable<User["status"]>, "available" | "busy"> = {
  Available: "available",
  Busy: "busy",
};
const STATUS_FROM_DB: Record<"available" | "busy", NonNullable<User["status"]>> = {
  available: "Available",
  busy: "Busy",
};

function mapRow(row: ProfileRow, priv?: ProfilePrivateRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    title: row.title ?? "",
    status: row.status ? STATUS_FROM_DB[row.status] : undefined,
    avatar: row.avatar ?? "",
    color: row.color,
    bio: row.bio ?? undefined,
    phone: row.phone ?? undefined,
    timezone: row.timezone ?? undefined,
    workingHours: row.working_hours ?? undefined,
    address: row.address ?? undefined,
    linkedin: row.linkedin ?? undefined,
    github: row.github ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zipCode: row.zip_code ?? undefined,
    shortcuts: row.shortcuts ?? undefined,
    hourlyRate: priv?.hourly_rate ?? undefined,
    financialType: priv?.financial_type ?? undefined,
    financialAmount: priv?.financial_amount ?? undefined,
    emergencyContact: priv?.emergency_contact ?? undefined,
    internalNotes: priv?.internal_notes ?? undefined,
    memberShareToken: priv?.member_share_token ?? undefined,
  };
}

export async function listProfiles(): Promise<User[]> {
  const [{ data: rows, error }, { data: privRows, error: privError }] = await Promise.all([
    supabase.from("profiles").select("*"),
    // Staff-only per RLS — a client-role session just gets an empty result here, which is fine.
    supabase.from("profile_private").select("*"),
  ]);
  if (error) throw error;
  if (privError) throw privError;
  const privByUser = new Map((privRows ?? []).map((p) => [(p as ProfilePrivateRow).user_id, p as ProfilePrivateRow]));
  return (rows ?? []).map((r) => mapRow(r as ProfileRow, privByUser.get((r as ProfileRow).id)));
}

/** Invites a new team member by email — see the file header for why this
 * can't be a plain INSERT. Resolves once the trigger-created profile row is
 * visible (usually immediate; retried briefly in case of replication lag). */
export async function inviteTeamMember(
  input: Partial<User> & Pick<User, "name" | "email" | "title">
): Promise<User> {
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      data: { name: input.name, role: input.role ?? "team" },
    },
  });
  if (otpError) throw otpError;

  let row: ProfileRow | null = null;
  for (let attempt = 0; attempt < 5 && !row; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
    const { data, error } = await supabase.from("profiles").select("*").eq("email", input.email).maybeSingle();
    if (error) throw error;
    row = data as ProfileRow | null;
  }
  if (!row) throw new Error(`Invited ${input.email}, but couldn't find their profile yet — try refreshing shortly.`);

  const patch = {
    title: input.title,
    color: input.color,
    avatar: input.avatar,
  };
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", row.id)
    .select("*")
    .single();
  if (updateError) throw updateError;

  return mapRow(updated as ProfileRow);
}

/** Resends the sign-in magic link to an existing (already-invited) team
 * member — e.g. if their first invite email expired or got lost. Safe to
 * call repeatedly: since the auth.users row already exists, this doesn't
 * re-trigger handle_new_user() or touch the profiles row at all. */
export async function resendTeamInviteRecord(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
    },
  });
  if (error) throw error;
}

export async function updateProfileRecord(id: string, patch: Partial<User>): Promise<void> {
  const profileFields: Record<string, unknown> = {};
  if (patch.name !== undefined) profileFields.name = patch.name;
  if (patch.email !== undefined) profileFields.email = patch.email;
  if (patch.role !== undefined) profileFields.role = patch.role;
  if (patch.title !== undefined) profileFields.title = patch.title;
  if (patch.status !== undefined) profileFields.status = patch.status ? STATUS_TO_DB[patch.status] : null;
  if (patch.avatar !== undefined) profileFields.avatar = patch.avatar;
  if (patch.color !== undefined) profileFields.color = patch.color;
  if (patch.bio !== undefined) profileFields.bio = patch.bio;
  if (patch.phone !== undefined) profileFields.phone = patch.phone;
  if (patch.timezone !== undefined) profileFields.timezone = patch.timezone;
  if (patch.workingHours !== undefined) profileFields.working_hours = patch.workingHours;
  if (patch.address !== undefined) profileFields.address = patch.address;
  if (patch.city !== undefined) profileFields.city = patch.city;
  if (patch.state !== undefined) profileFields.state = patch.state;
  if (patch.zipCode !== undefined) profileFields.zip_code = patch.zipCode;
  if (patch.linkedin !== undefined) profileFields.linkedin = patch.linkedin;
  if (patch.github !== undefined) profileFields.github = patch.github;
  if (patch.shortcuts !== undefined) profileFields.shortcuts = patch.shortcuts;

  if (Object.keys(profileFields).length > 0) {
    const { error } = await supabase.from("profiles").update(profileFields).eq("id", id);
    if (error) throw error;
  }

  const privFields: Record<string, unknown> = {};
  if (patch.hourlyRate !== undefined) privFields.hourly_rate = patch.hourlyRate;
  if (patch.financialType !== undefined) privFields.financial_type = patch.financialType;
  if (patch.financialAmount !== undefined) privFields.financial_amount = patch.financialAmount;
  if (patch.emergencyContact !== undefined) privFields.emergency_contact = patch.emergencyContact;
  if (patch.internalNotes !== undefined) privFields.internal_notes = patch.internalNotes;
  if (patch.memberShareToken !== undefined) privFields.member_share_token = patch.memberShareToken;

  if (Object.keys(privFields).length > 0) {
    const { error } = await supabase.from("profile_private").upsert({ user_id: id, ...privFields });
    if (error) throw error;
  }
}

/** Deletes the profile row only — see the file header re: orphaned auth.users rows.
 *
 * comments.author and messages.author reference profiles with `on delete
 * restrict` (by design — an old comment/message should never end up
 * pointing at a row that no longer exists), so this fails with Postgres
 * error 23503 for anyone who has ever posted a comment or message. That's
 * intentional, but Supabase's PostgrestError isn't an `Error` instance, so
 * left as-is it surfaces to the UI as a bare "Something went wrong" (see
 * useAsyncAction in components/modals/index.tsx, which only shows
 * `e.message` for real Error instances). Wrap it in a real Error with an
 * honest explanation instead.
 */
export async function deleteProfileRecord(id: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "This person has authored comments or messages in the portal, so they can't be permanently deleted — that history needs to stay attributed to someone."
      );
    }
    throw new Error(error.message || "Failed to delete team member.");
  }
}
