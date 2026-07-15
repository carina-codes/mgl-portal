"use client";

import { AppShell } from "@/components/app-shell";
import { FolderOpen } from "lucide-react";

function PortalProjects() {
  return (
    <AppShell role="client" title="Projects" subtitle="Track progress across your active work.">
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <FolderOpen className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Projects</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This section is being rebuilt.
        </p>
      </div>
    </AppShell>
  );
}

export default PortalProjects;
