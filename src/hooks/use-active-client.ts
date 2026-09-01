"use client";

import { useStore } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import type { Client } from "@/lib/mock-data";

/**
 * The signed-in client contact's company record. clientId comes from the
 * real Supabase session (profiles.client_id, see role-context.tsx) — this
 * used to read a `localStorage` key left over from the pre-auth mock
 * role-switcher, which meant it could point at the wrong company (or a
 * stale one) once real login was wired up.
 */
// Never undefined — mirrors useCurrentUser()'s LOADING_PROFILE fallback —
// so existing display code (`client.name`, `client.id`, ...) keeps working
// during the brief window before clients hydrate from Supabase (and, on a
// static export build, the server-rendered pass where the store is always
// empty).
const LOADING_CLIENT: Client = {
  id: "",
  name: "Loading…",
  industry: "",
  logoColor: "#0049FE",
  contact: "",
  contactEmail: "",
  status: "active",
  retainer: "",
  since: "",
  projects: 0,
  openRequests: 0,
  hoursMonth: 0,
  health: "healthy",
};

export function useActiveClient() {
  const clients = useStore((s) => s.clients);
  const { clientId } = useRole();

  const client = clients.find((c) => c.id === clientId) || clients[0] || LOADING_CLIENT;

  return { client, clientId };
}
