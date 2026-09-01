"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AIAssistant } from "@/components/ai-assistant";
import { useRole } from "@/lib/role-context";

// next.config.ts sets output: "export" — there's no server to run
// middleware in production, so route protection for the /owner, /client
// and /team portals happens here, client-side, gated on the real Supabase
// session. The actual security boundary is Postgres RLS (see
// supabase/migrations/); this guard just keeps people out of a portal
// shell that would render empty for their role.
const PORTAL_FOR_ROLE: Record<string, string> = {
  owner: "/owner",
  manager: "/team",
  team: "/team",
  client: "/client",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, session, profile, loading, signOut } = useRole();
  const pathname = usePathname() || "";
  const router = useRouter();

  // A session with no profile means the account was removed (deleteProfileRecord
  // in src/lib/data/profiles.ts only deletes the profiles row — it can't reach
  // the underlying auth.users row without the service-role key). role-context
  // falls back to "owner" for `role` in this state purely so nav doesn't crash
  // during the brief pre-hydration window — it must NOT be treated as real
  // owner access here, or a removed team member would land back in /owner.
  const revoked = !loading && !!session && !profile;

  useEffect(() => {
    if (loading) return;

    if (revoked) {
      signOut().then(() => router.replace("/"));
      return;
    }

    if (!session) {
      router.replace("/");
      return;
    }

    const home = PORTAL_FOR_ROLE[role] ?? "/owner";
    if (!pathname.startsWith(home)) {
      router.replace(home);
    }
  }, [role, session, revoked, loading, pathname, router, signOut]);

  if (loading || !session || revoked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AIAssistant />
    </>
  );
}
