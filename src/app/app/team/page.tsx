"use client";

import { PortalShell } from "@/components/portal-shell";
import { Users } from "lucide-react";

export default function TeamDashboard() {
  return (
    <PortalShell title="Team Dashboard" subtitle="Overview of your active agency projects.">
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Team Dashboard</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This workspace is currently under construction. Once finalized, it will feature similar collaborative project views, task boards, and communication channels to the client portal.
        </p>
      </div>
    </PortalShell>
  );
}
