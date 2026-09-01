"use client";

import { useStore } from "@/lib/store";
import { useRole } from "@/lib/role-context";

/**
 * The signed-in client contact's company record. clientId comes from the
 * real Supabase session (profiles.client_id, see role-context.tsx) — this
 * used to read a `localStorage` key left over from the pre-auth mock
 * role-switcher, which meant it could point at the wrong company (or a
 * stale one) once real login was wired up.
 */
export function useActiveClient() {
  const clients = useStore((s) => s.clients);
  const { clientId } = useRole();

  const client = clients.find((c) => c.id === clientId) || clients[0];

  return { client, clientId };
}
