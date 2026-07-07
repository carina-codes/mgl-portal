"use client";


import { PortalShell } from "@/components/portal-shell";
import { REQUEST_STATUS_META, REQUEST_TYPE_META } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Upload, FolderPlus, ListPlus, RefreshCw, MessageCircleQuestion, Calendar } from "lucide-react";

const TYPES = [
  { id: "revision", label: "Revision", icon: RefreshCw },
  { id: "new_task", label: "Task", icon: ListPlus },
  { id: "new_project", label: "Project", icon: FolderPlus },
  { id: "meeting", label: "Meeting", icon: Calendar },
  { id: "question", label: "Question", icon: MessageCircleQuestion },
] as const;

function PortalRequests() {
  const [selected, setSelected] = useState<(typeof TYPES)[number]["id"]>("revision");
  const { client } = useActiveClient();
  const requests = useStore((s) => s.requests);
  const my = requests.filter((r) => r.clientId === client.id);
  return (
    <PortalShell title="Requests" subtitle="Submit, track, and follow up on requests">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-6">
          <h3 className="text-lg font-semibold">Submit a new request</h3>
          <p className="mt-1 text-xs text-muted-foreground">Your team will review and respond — nothing goes into active work without scope approval.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = selected === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors",
                    active ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 space-y-3">
            <input placeholder="Title" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <textarea rows={5} placeholder="Add details, links or screenshots…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <div className="flex items-center justify-between">
              <button className="text-xs text-muted-foreground hover:text-foreground"><Upload className="mr-1 inline h-3.5 w-3.5" /> Attach file</button>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Send className="h-4 w-4" /> Submit request
              </button>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="text-lg font-semibold">Your recent requests</h3>
          <div className="mt-4 space-y-3">
            {my.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-background p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_META[r.status].cls}`}>
                    {REQUEST_STATUS_META[r.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
                </div>
                <div className="text-sm font-medium">{r.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{REQUEST_TYPE_META[r.type].label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

export default PortalRequests;
