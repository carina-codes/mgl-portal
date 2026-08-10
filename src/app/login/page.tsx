"use client";

import { useRole } from "@/lib/role-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Post-auth landing page. Reached after a password sign-in (from `/`) or a
 * magic-link redirect (from `/auth/callback`) — waits for the session +
 * profile to resolve, then routes to the portal that matches the real role.
 */
export default function AppRootRedirect() {
  const { role, session, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/");
      return;
    }

    if (role === "owner") {
      router.replace("/owner");
    } else if (role === "client") {
      router.replace("/client");
    } else {
      // "team" and "manager" share the /team portal — manager just gets a
      // wider nav (see TEAM_MANAGER_ONLY_LABELS in app-shell.tsx).
      router.replace("/team");
    }
  }, [role, session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground animate-pulse">
        Redirecting to dashboard...
      </div>
    </div>
  );
}
