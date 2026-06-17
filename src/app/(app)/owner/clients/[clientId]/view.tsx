"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import {
  clients,
  projects,
  requests,
  users,
  PROJECT_STATUS_META,
  REQUEST_STATUS_META,
} from "@/lib/mock-data";
import { ArrowLeft, Mail, MessageSquare, Plus } from "lucide-react";



function ClientDetail() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw notFound();
  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const clientRequests = requests.filter((r) => r.clientId === clientId);

  return (
    <AppShell>
      <Link href="/owner/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All clients
      </Link>

      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 place-items-center rounded-3xl text-xl font-semibold text-white"
              style={{ backgroundColor: client.logoColor }}
            >
              {client.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground">{client.industry}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1">Since {client.since}</span>
                <span className="rounded-full bg-muted px-3 py-1">{client.retainer}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{client.status}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <Mail className="h-4 w-4" /> Email
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <MessageSquare className="h-4 w-4" /> Message
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New project
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Primary contact</div>
          <div className="mt-2 text-lg font-semibold">{client.contact}</div>
          <div className="text-sm text-muted-foreground">{client.contactEmail}</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Hours this month</div>
          <div className="mt-2 text-3xl font-semibold">{client.hoursMonth}</div>
          <div className="text-xs text-muted-foreground">Across {clientProjects.length} projects</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Open requests</div>
          <div className="mt-2 text-3xl font-semibold">{client.openRequests}</div>
          <div className="text-xs text-muted-foreground">{clientRequests.filter((r) => r.status === "submitted").length} need review</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="mb-4 text-lg font-semibold">Projects</h3>
          <div className="space-y-3">
            {clientProjects.map((p) => (
              <Link
                key={p.id}
                href={`/owner/projects/${p.id }`}
                className="block rounded-2xl border border-border bg-background p-4 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                    {PROJECT_STATUS_META[p.status].label}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                  <AvatarStack userIds={p.team} users={users} max={3} size={22} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent requests</h3>
          <div className="space-y-3">
            {clientRequests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-background p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_META[r.status].cls}`}>
                    {REQUEST_STATUS_META[r.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
                </div>
                <div className="text-sm font-medium">{r.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default ClientDetail;
