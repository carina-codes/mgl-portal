"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useStore } from "@/lib/store";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const clients = useStore((s) => s.clients);

  useEffect(() => {
    if (token) {
      const matchedClient = clients.find((c) => c.clientShareToken === token);
      if (matchedClient) {
        localStorage.setItem("activeClientId", matchedClient.id);
      }
    }
  }, [token, clients]);

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </Suspense>
  );
}
