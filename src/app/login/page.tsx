"use client";

import { useRole } from "@/lib/role-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppRootRedirect() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "owner") {
      router.replace("/owner");
    } else if (role === "client") {
      router.replace("/client");
    } else if (role === "team") {
      router.replace("/team");
    }
  }, [role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground animate-pulse">
        Redirecting to dashboard...
      </div>
    </div>
  );
}
