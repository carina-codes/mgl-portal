"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";

/**
 * Magic-link landing target (see emailRedirectTo in src/app/page.tsx). The
 * Supabase client auto-detects the auth tokens in the URL on load
 * (detectSessionInUrl) and fires onAuthStateChange — role-context picks
 * that up, we just wait for it and hand off to /login to route by role.
 */
export default function AuthCallbackPage() {
  const { session, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/login" : "/");
  }, [session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground animate-pulse">Signing you in...</div>
    </div>
  );
}
