"use client";

import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { projects, clients, deliverables, DELIVERABLE_STATUS_META, PROJECT_STATUS_META } from "@/lib/mock-data";
import { ArrowRight, Send } from "lucide-react";



function PortalHome() {
  // Client u8 = Marcus / Arcadia
  const client = clients.find((c) => c.id === "c1")!;
  const myProjects = projects.filter((p) => p.clientId === client.id);
  const myDeliverables = deliverables.filter((d) => myProjects.some((p) => p.id === d.projectId));

  return (
    <PortalShell
      title={`Hello, Marcus`}
      subtitle={`Here's what's happening on your ${myProjects.length} ${client.name} projects.`}
      actions={
        <Link href="/portal/requests" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Send className="h-4 w-4" /> Submit a request
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Active projects" value={myProjects.length.toString()} tone="bg-progress" />
        <Stat label="Deliverables awaiting your review" value={myDeliverables.filter((d) => d.status === "client_review").length.toString()} tone="bg-review" />
        <Stat label="Open requests" value={client.openRequests.toString()} tone="bg-todo" />
      </div>

      <div className="mt-6 panel p-6">
        <h2 className="mb-4 text-lg font-semibold">Your projects</h2>
        <div className="space-y-3">
          {myProjects.map((p) => (
            <Link
              key={p.id}
              href={`/portal/projects/${p.id }`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className={`h-12 w-12 rounded-2xl bg-${p.accent}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                    {PROJECT_STATUS_META[p.status].label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{p.progress}%</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 panel p-6">
        <h2 className="mb-4 text-lg font-semibold">Deliverables for review</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myDeliverables.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-background overflow-hidden">
              <div className={`h-28 bg-gradient-to-br ${d.thumbnail}`} />
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DELIVERABLE_STATUS_META[d.status].cls}`}>
                    {DELIVERABLE_STATUS_META[d.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{d.version}</span>
                </div>
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">Request revision</button>
                  <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`${tone} rounded-3xl p-5`}>
      <div className="text-xs font-medium text-foreground/60">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}

export default PortalHome;
