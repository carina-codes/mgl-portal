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
  const { role, session, loading } = useRole();
  const pathname = usePathname() || "";
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/");
      return;
    }

    const home = PORTAL_FOR_ROLE[role] ?? "/owner";
    if (!pathname.startsWith(home)) {
      router.replace(home);
    }
  }, [role, session, loading, pathname, router]);

  if (loading || !session) {
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
