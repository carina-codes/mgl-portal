"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, FolderOpen } from "lucide-react";

function PortalProjectDetail() {
  return (
    <AppShell role="client">
      <Link href="/client/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <FolderOpen className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Project Detail</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This section is being rebuilt.
        </p>
      </div>
    </AppShell>
  );
}

export default PortalProjectDetail;
