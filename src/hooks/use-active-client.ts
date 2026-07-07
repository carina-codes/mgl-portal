"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function useActiveClient() {
  const clients = useStore((s) => s.clients);
  const [clientId, setClientId] = useState("c1");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeClientId");
      if (saved && clients.some((c) => c.id === saved)) {
        setClientId(saved);
      }
    }
  }, [clients]);

  const client = clients.find((c) => c.id === clientId) || clients[0];

  return { client, clientId };
}
