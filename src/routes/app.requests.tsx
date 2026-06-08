import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { requests, clients, REQUEST_STATUS_META, REQUEST_TYPE_META, PRIORITY_META } from "@/lib/mock-data";
import { Filter, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/requests")({ component: RequestsPage });

const STATUSES = ["all", "submitted", "needs_clarification", "under_review", "approved", "rejected"] as const;

function RequestsPage() {
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <AppShell
      title="Requests"
      subtitle={`${requests.length} requests · ${requests.filter((r) => r.status === "submitted").length} need first review`}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Log request
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize",
              filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => {
          const client = clients.find((c) => c.id === r.clientId)!;
          const sm = REQUEST_STATUS_META[r.status];
          const tm = REQUEST_TYPE_META[r.type];
          const pm = PRIORITY_META[r.priority];
          return (
            <div key={r.id} className="panel p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sm.cls}`}>{sm.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{tm.label}</span>
                <span className={`rounded-full px-2 py-0.5 ${pm.cls}`}>{pm.label}</span>
              </div>
              <div className="mt-2 text-sm font-semibold">{r.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">{client.name}</span>
                <div className="flex gap-1">
                  <button className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-muted">Clarify</button>
                  <button className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">Approve</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
