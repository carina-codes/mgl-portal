"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleProvider } from "@/lib/role-context";
import { ModalsHost } from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";

function TabNotificationHandler() {
  useEffect(() => {
    const nextTitle = "Carina Client Platform";
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }
  }, []);

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
      <RoleProvider initial="owner">
        {children}
        <TabNotificationHandler />
        <ModalsHost />
        <Toaster position="bottom-right" richColors closeButton />
      </RoleProvider>
    </QueryClientProvider>
  );
}
