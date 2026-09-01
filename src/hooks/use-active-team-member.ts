"use client";

import { useStore } from "@/lib/store";
import { useRole } from "@/lib/role-context";

/**
 * Mirrors useActiveClient(), but for the /team portal. Identity comes from
 * the real Supabase session (role-context) — this used to read a
 * `localStorage` key left over from the pre-auth mock role-switcher
 * (magic-link `?token=` params were resolved into that key), which meant a
 * signed-in team member could see/act as whoever was last previewed on that
 * browser instead of themselves.
 */
export function useActiveTeamMember() {
  const users = useStore((s) => s.users);
  const { userId } = useRole();

  const fallback = users.find((u) => u.role === "team" || u.role === "manager") || users[0];
  const member = users.find((u) => u.id === userId && (u.role === "team" || u.role === "manager")) || fallback;

  return { member, memberId: member.id, isManager: member.role === "manager" };
}
