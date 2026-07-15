"use client";

import { AppShell } from "@/components/app-shell";
import { Send } from "lucide-react";

function PortalRequests() {
  return (
    <AppShell role="client" title="Requests" subtitle="Submit, track, and follow up on requests.">
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Send className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Requests</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This section is being rebuilt.
        </p>
      </div>
    </AppShell>
  );
}

export default PortalRequests;
