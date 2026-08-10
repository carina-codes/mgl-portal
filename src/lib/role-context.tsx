"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Role } from "@/lib/mock-data";

/**
 * Real identity, sourced from the Supabase session + the user's `profiles`
 * row (see supabase/migrations/20260811000000_init_schema.sql). Replaces
 * the old client-side role toggle — role is no longer something the app
 * can set, it's a fact about who's signed in, enforced by RLS.
 */
export type AuthProfile = {
  id: string;
  clientId: string | null;
  name: string;
  email: string;
  role: Role;
  title: string;
  phone: string;
  avatar: string;
  color: string;
};

type RoleContextValue = {
  role: Role;
  /**
   * @deprecated No-op. Role now comes from the authenticated Supabase
   * session, not a client-side switch — there's no longer anything to set.
   * Kept only so pre-existing (unused) call sites don't break the build.
   */
  setRole: (r: Role) => void;
  userId: string;
  clientId: string | null;
  profile: AuthProfile | null;
  session: Session | null;
  /** True until the initial session check + profile fetch resolve. */
  loading: boolean;
  signOut: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const noopSetRole = () => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("setRole() is a no-op — role now comes from the authenticated Supabase session.");
  }
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, client_id, name, email, role, title, phone, avatar, color")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        console.error("Failed to load profile for the signed-in user", error);
        setProfile(null);
        return;
      }

      setProfile({
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        email: data.email,
        role: data.role,
        title: data.title ?? "",
        phone: data.phone ?? "",
        avatar: data.avatar ?? "",
        color: data.color,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setLoading(true);
        loadProfile(newSession.user.id).finally(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: RoleContextValue = {
    // Falls back to "owner" while loading/unauthenticated purely so nav
    // components render something sane before the route guard (in
    // (app)/layout.tsx) redirects. RLS — not this value — is what actually
    // gates data access.
    role: profile?.role ?? "owner",
    setRole: noopSetRole,
    userId: session?.user.id ?? "",
    clientId: profile?.clientId ?? null,
    profile,
    session,
    loading,
    signOut,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    // Mirrors the previous fallback for anything rendered outside the
    // provider tree.
    return {
      role: "owner" as Role,
      setRole: noopSetRole,
      userId: "",
      clientId: null,
      profile: null,
      session: null,
      loading: false,
      signOut: async () => {},
    };
  }
  return ctx;
}

const LOADING_PROFILE: AuthProfile = {
  id: "",
  clientId: null,
  name: "Loading…",
  email: "",
  role: "owner",
  title: "",
  phone: "",
  avatar: "",
  color: "#0049FE",
};

/** Real profile of whoever is signed in. Never null so existing display
 * code (`user.name`, `user.avatar`, ...) keeps working during the brief
 * window before the profile fetch resolves. */
export function useCurrentUser(): AuthProfile {
  const { profile } = useRole();
  return profile ?? LOADING_PROFILE;
}
