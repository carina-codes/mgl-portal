"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Mirrors useActiveClient(), but for the /team portal. A team or manager
 * user reaches their portal via a magic link (?token=...) that gets
 * resolved to a user id and persisted in localStorage by team/layout.tsx.
 */
export function useActiveTeamMember() {
  const users = useStore((s) => s.users);
  const [memberId, setMemberId] = useState("u2");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeTeamMemberId");
      if (saved && users.some((u) => u.id === saved && (u.role === "team" || u.role === "manager"))) {
        setMemberId(saved);
      }
    }
  }, [users]);

  const fallback = users.find((u) => u.role === "team" || u.role === "manager") || users[0];
  const member = users.find((u) => u.id === memberId && (u.role === "team" || u.role === "manager")) || fallback;

  return { member, memberId: member.id, isManager: member.role === "manager" };
}
