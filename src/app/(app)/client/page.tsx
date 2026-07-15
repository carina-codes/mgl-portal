"use client";

import { AppShell } from "@/components/app-shell";
import { LayoutDashboard } from "lucide-react";

function PortalHome() {
  return (
    <AppShell role="client" title="Overview" subtitle="Your projects, requests and activity in one place.">
      <div className="flex min-h-100 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Client Overview</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This section is being rebuilt.
        </p>
      </div>
    </AppShell>
  );
}

export default PortalHome;
