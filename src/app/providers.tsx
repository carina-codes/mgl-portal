"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleProvider } from "@/lib/role-context";
import { ModalsHost } from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";

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
        <ModalsHost />
        <Toaster position="bottom-right" richColors closeButton />
      </RoleProvider>
    </QueryClientProvider>
  );
}
