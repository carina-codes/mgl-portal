"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useStore } from "@/lib/store";

function TeamLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const users = useStore((s) => s.users);

  useEffect(() => {
    if (token) {
      const matchedUser = users.find((u) => u.memberShareToken === token && (u.role === "team" || u.role === "manager"));
      if (matchedUser) {
        localStorage.setItem("activeTeamMemberId", matchedUser.id);
      }
    }
  }, [token, users]);

  return <>{children}</>;
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TeamLayoutContent>{children}</TeamLayoutContent>
    </Suspense>
  );
}
