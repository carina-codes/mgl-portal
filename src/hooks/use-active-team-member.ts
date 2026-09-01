"use client";

import { useStore } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import type { User } from "@/lib/mock-data";

/**
 * Mirrors useActiveClient(), but for the /team portal. Identity comes from
 * the real Supabase session (role-context) — this used to read a
 * `localStorage` key left over from the pre-auth mock role-switcher
 * (magic-link `?token=` params were resolved into that key), which meant a
 * signed-in team member could see/act as whoever was last previewed on that
 * browser instead of themselves.
 */
// Never undefined — mirrors useCurrentUser()'s LOADING_PROFILE fallback —
// so existing display code (`member.name`, `member.id`, ...) keeps working
// during the brief window before the team hydrates from Supabase (and, on
// a static export build, the server-rendered pass where the store is
// always empty).
const LOADING_MEMBER: User = {
  id: "",
  name: "Loading…",
  email: "",
  role: "team",
  title: "",
  avatar: "",
  color: "#0049FE",
};

export function useActiveTeamMember() {
  const users = useStore((s) => s.users);
  const { userId } = useRole();

  const fallback = users.find((u) => u.role === "team" || u.role === "manager") || users[0] || LOADING_MEMBER;
  const member = users.find((u) => u.id === userId && (u.role === "team" || u.role === "manager")) || fallback;

  return { member, memberId: member.id, isManager: member.role === "manager" };
}
