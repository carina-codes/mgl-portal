"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleProvider, useRole } from "@/lib/role-context";
import { ModalsHost } from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";

function TabNotificationHandler() {
  useEffect(() => {
    const nextTitle = "MGL Portal";
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }
  }, []);

  return null;
}

/** Loads clients/projects from Supabase once a session exists (see
 * useStore.hydrate in lib/store.ts), and clears them back out on sign-out
 * so a different account signing in on the same tab doesn't briefly see
 * the previous user's data. */
function StoreHydrator() {
  const { session, loading } = useRole();
  // Supabase fires onAuthStateChange (and hands us a brand-new `session`
  // object) on more than just sign-in/out — a periodic TOKEN_REFRESHED
  // event, or the tab regaining focus, produces a new reference for the
  // *same* signed-in user. Keying this effect on the whole `session`
  // object meant every one of those refreshes re-ran hydrate(), which
  // does a full re-fetch and blindly overwrites the store — including
  // any optimistic update (e.g. a file upload's storage_path) that was
  // set locally after that re-fetch's query had already started. Keying
  // on the user id instead means we only re-hydrate on an actual
  // sign-in, sign-out, or account switch.
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (loading) return;
    if (userId) {
      useStore.getState().hydrate();
    } else {
      useStore.setState({
        users: [],
        clients: [],
        projects: [],
        tasks: [],
        requests: [],
        documents: [],
        timeEntries: [],
        comments: [],
        channels: [],
        hydrated: false,
      });
    }
  }, [userId, loading]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        {children}
        <TabNotificationHandler />
        <StoreHydrator />
        <ModalsHost />
        <Toaster position="bottom-right" richColors closeButton />
      </RoleProvider>
    </QueryClientProvider>
  );
}
