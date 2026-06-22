"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleProvider } from "@/lib/role-context";
import { ModalsHost } from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/store";

function TabNotificationHandler() {
  const channels = useStore((s) => s.channels);
  const requests = useStore((s) => s.requests);

  useEffect(() => {
    const unreadMessages = channels.reduce((sum, ch) => sum + (ch.unread || 0), 0);
    const newRequests = requests.filter((r) => r.status === "submitted").length;

    const updateTitle = () => {
      let nextTitle = "Carina Client Platform";
      if (unreadMessages > 0) {
        nextTitle = `(${unreadMessages}) Messages | Carina Client Platform`;
      } else if (newRequests > 0) {
        nextTitle = `(${newRequests}) Requests | Carina Client Platform`;
      }
      if (document.title !== nextTitle) {
        document.title = nextTitle;
      }
    };

    updateTitle();

    const observer = new MutationObserver(() => {
      updateTitle();
    });

    const headEl = document.head;
    if (headEl) {
      observer.observe(headEl, { subtree: true, childList: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [channels, requests]);

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
