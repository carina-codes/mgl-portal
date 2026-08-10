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

  useEffect(() => {
    if (loading) return;
    if (session) {
      useStore.getState().hydrate();
    } else {
      useStore.setState({ clients: [], projects: [], hydrated: false });
    }
  }, [session, loading]);

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
