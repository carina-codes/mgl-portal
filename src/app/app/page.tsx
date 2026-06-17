"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UserAvatar, AvatarStack } from "@/components/user-avatar";
import {
  clients,
  projects,
  requests,
  deliverables,
  users,
  tasks,
  REQUEST_STATUS_META,
  PROJECT_STATUS_META,
  STAGE_META,
} from "@/lib/mock-data";
import {
  TrendingUp,
  Inbox,
  PackageCheck,
  Clock,
  ArrowUpRight,
  Plus,
  CircleDot,
} from "lucide-react";

export default function Dashboard() {
  const activeProjects = projects.filter((p) => p.status !== "completed").length;
  const openRequests = requests.filter((r) => !["approved", "rejected", "converted_task", "converted_project"].includes(r.status)).length;
  const pendingReview = deliverables.filter((d) => d.status === "client_review" || d.status === "internal_review").length;
  const recentRequests = requests.slice(0, 5);
  const featured = projects.slice(0, 3);

  return (
    <AppShell
      title="Good morning, Jordan"
      subtitle="Here's what's moving across the studio today"
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New project
        </button>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active projects" value={activeProjects} delta="+2 this month" icon={TrendingUp} tone="bg-progress" />
        <Kpi label="Open requests" value={openRequests} delta="3 need review" icon={Inbox} tone="bg-todo" />
        <Kpi label="In client review" value={pendingReview} delta="2 overdue" icon={PackageCheck} tone="bg-review" />
        <Kpi label="Hours this week" value="186" delta="+12% vs last" icon={Clock} tone="bg-done" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active projects */}
        <div className="xl:col-span-2 panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active projects</h2>
              <p className="text-xs text-muted-foreground">Across all clients</p>
            </div>
            <Link href="/app/projects" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {featured.map((p) => {
              const client = clients.find((c) => c.id === p.clientId)!;
              const stageColor = `bg-${p.accent}`;
              return (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                >
                  <div className={`h-12 w-12 shrink-0 rounded-2xl ${stageColor}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}
                      >
                        {PROJECT_STATUS_META[p.status].label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {client.name} · Lead: {users.find((u) => u.id === p.lead)?.name.split(" ")[0]} ·{" "}
                      Due {p.endDate}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                      </div>
                      <div className="w-10 text-right text-[11px] font-medium text-muted-foreground">{p.progress}%</div>
                    </div>
                  </div>
                  <AvatarStack userIds={p.team} users={users} max={3} size={24} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Inbox preview */}
        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Request inbox</h2>
              <p className="text-xs text-muted-foreground">Awaiting your call</p>
            </div>
            <Link href="/app/requests" className="text-sm font-medium text-primary hover:underline">
              All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.map((r) => {
              const meta = REQUEST_STATUS_META[r.status];
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-background p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
                  </div>
                  <div className="line-clamp-1 text-sm font-medium">{r.title}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {clients.find((c) => c.id === r.clientId)?.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: by-stage snapshot */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="mb-1 text-lg font-semibold">Studio workload</h2>
          <p className="mb-4 text-xs text-muted-foreground">Tasks across all projects</p>
          <div className="grid grid-cols-4 gap-3">
            {(["todo", "in_progress", "in_review", "completed"] as const).map((stage) => {
              const count = tasks.filter((t) => t.stage === stage).length;
              const meta = STAGE_META[stage];
              return (
                <div key={stage} className={`${meta.tone} rounded-2xl p-4`}>
                  <div className={`mb-2 flex items-center gap-1 text-[11px] font-semibold ${meta.pill}`}>
                    <CircleDot className="h-2.5 w-2.5" />
                    {meta.label}
                  </div>
                  <div className="text-3xl font-semibold">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Team activity</h2>
              <p className="text-xs text-muted-foreground">Today's contributors</p>
            </div>
            <Link href="/app/team" className="text-sm font-medium text-primary hover:underline">
              All →
            </Link>
          </div>
          <div className="space-y-3">
            {users
              .filter((u) => u.role !== "client")
              .slice(0, 5)
              .map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <UserAvatar user={u} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.title}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    {(u.id.charCodeAt(u.id.length - 1) % 6) + 2}h today
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  delta: string;
  icon: typeof TrendingUp;
  tone: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
