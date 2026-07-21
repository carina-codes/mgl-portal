"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { UserAvatar } from "@/components/user-avatar";
import { useActiveClient } from "@/hooks/use-active-client";
import { useStore } from "@/lib/store";
import { useActivityFeed, selectRecentActivity } from "@/lib/activity";
import { REQUEST_STATUS_META } from "@/lib/mock-data";
import {
  TrendingUp,
  Inbox,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  FileUp,
  PlusCircle,
  FolderPlus,
  Pencil,
  FolderCog,
  CircleDot,
} from "lucide-react";

const MESSAGE_INBOX = [
  { id: "msg-1", user: "Mia Tanaka", project: "NovaBoard Mobile App", text: "@carina I just uploaded the layout draft. Let me know what you think!", time: "10m ago" },
  { id: "msg-2", user: "Devon Patel", project: "Halcyon CarePortal Support", text: "@carina could you check the billing rate on Halcyon Ventures client card?", time: "2h ago" },
  { id: "msg-3", user: "Ava Lindgren", project: "Arcadia Marketing Site Refresh", text: "@carina the wireframes for the user onboarding are complete.", time: "1d ago" },
];

function useGreeting() {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return greeting;
}

function PortalHome() {
  const { client } = useActiveClient();
  const greeting = useGreeting();
  const projects = useStore((s) => s.projects);
  const requests = useStore((s) => s.requests);
  const users = useStore((s) => s.users);
  const timeEntries = useStore((s) => s.timeEntries);

  const firstName = client.contact.split(" ")[0] || "there";
  const myProjects = projects.filter((p) => p.clientId === client.id);
  const myProjectIds = myProjects.map((p) => p.id);
  const myProjectNames = new Set(myProjects.map((p) => p.name));

  const activeProjects = myProjects.filter((p) => p.status !== "completed").length;
  const myRequests = requests.filter((r) => r.clientId === client.id);
  const openRequests = myRequests.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const submittedRequestsCount = myRequests.filter((r) => r.status === "submitted").length;
  const recentRequests = myRequests.slice(0, 5);
  const hoursLogged = timeEntries
    .filter((t) => myProjectIds.includes(t.projectId))
    .reduce((sum, e) => sum + e.hours, 0);

  // Scoped to this client's own projects only — a client should never see
  // another client's activity.
  const myActivity = selectRecentActivity(
    useActivityFeed().filter((a) => myProjectNames.has(a.project)),
  );
  const myMessages = MESSAGE_INBOX.filter((m) => myProjectNames.has(m.project));

  return (
    <AppShell
      role="client"
      title={`${greeting}, ${firstName}`}
      subtitle={`Here's what's moving across your ${myProjects.length} ${client.name} ${myProjects.length === 1 ? "project" : "projects"}`}
      actions={
        <Link
          href="/client/requests"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Send className="h-4 w-4" /> Submit a request
        </Link>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard
          label="Active projects"
          value={activeProjects}
          icon={TrendingUp}
          trend={{ value: `${myProjects.length} total`, positive: true }}
          color="purple"
          sparklineData={[12, 14, 13, 15, 17, 16, 18]}
          delay={0}
          href="/client/projects"
        />
        <KpiCard
          label="Open requests"
          value={openRequests}
          icon={Inbox}
          trend={{ value: `${submittedRequestsCount} awaiting review`, positive: false }}
          color="amber"
          sparklineData={[5, 4, 6, 3, 2, 4, 3]}
          delay={100}
          href="/client/requests"
        />
        <KpiCard
          label="Hours logged"
          value={hoursLogged}
          icon={Clock}
          trend={{ value: "Across your projects", positive: true }}
          color="blue"
          sparklineData={[160, 165, 170, 180, 175, 182, 186]}
          delay={200}
          href="/client/time"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3 items-start">
        {/* Latest Activity */}
        <div className="xl:col-span-2 panel pt-6 px-6 pb-2 h-[760px] flex flex-col">
          <div className="mb-[25px] flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-lg font-semibold">Latest activity</h2>
              <p className="text-xs text-muted-foreground">Updates across your projects</p>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {myActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-2xl">
                No activity yet on your projects.
              </div>
            ) : (
              myActivity.map((act) => {
                const Icon = {
                  comment: MessageSquare,
                  status: CheckCircle2,
                  file: FileUp,
                  task_add: PlusCircle,
                  task_update: Pencil,
                  request: Send,
                  project: FolderPlus,
                  project_update: FolderCog,
                }[act.type] || CircleDot;

                const iconCls = {
                  comment: "bg-blue-500/10 text-blue-500",
                  status: "bg-emerald-500/10 text-emerald-500",
                  file: "bg-purple-500/10 text-purple-500",
                  task_add: "bg-pink-500/10 text-pink-500",
                  task_update: "bg-slate-500/10 text-slate-500",
                  request: "bg-amber-500/10 text-amber-500",
                  project: "bg-indigo-500/10 text-indigo-500",
                  project_update: "bg-indigo-500/10 text-indigo-500",
                }[act.type] || "bg-muted text-muted-foreground";

                return (
                  <Link
                    key={act.id}
                    href={`/client/projects/view?projectId=${act.projectId}`}
                    className="flex gap-4 pb-3.5 mb-4 border-b border-border/40 last:border-b-0 last:mb-0 hover:bg-muted/5 transition-all cursor-pointer block"
                  >
                    <div className={`h-9 w-9 rounded-xl shrink-0 flex items-center justify-center ${iconCls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">{act.user}</span>
                        <span className="text-[10px] text-muted-foreground">{act.date}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed select-text">
                        {act.details}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-medium text-primary uppercase tracking-wider">
                        <span>{act.project}</span>
                        {act.taskName && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground normal-case">{act.taskName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Message Inbox & Request Inbox */}
        <div className="flex flex-col gap-6 h-[760px]">
          {/* Message Inbox */}
          <div className="panel pt-6 px-6 pb-2 flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Message inbox
                  {myMessages.length > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0049ff] text-[10px] font-bold text-white shrink-0 select-none">
                      {myMessages.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">Unread thread mentions</p>
              </div>
              <Link href="/client/messages" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {myMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-2xl">
                  No messages yet.
                </div>
              ) : (
                myMessages.map((msg) => {
                  const sender = users.find((u) => u.name === msg.user);
                  return (
                    <Link key={msg.id} href="/client/messages" className="flex gap-3 p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 transition-all">
                      <div className="shrink-0 pt-0.5">
                        {sender ? (
                          <UserAvatar user={sender} size={32} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                            {msg.user[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground">{msg.user}</span>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {msg.text}
                        </p>
                        {msg.project && (
                          <div className="mt-1.5 text-[9px] font-medium text-primary uppercase tracking-wider">
                            {msg.project}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Request Inbox */}
          <div className="panel pt-6 px-6 pb-2 flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Request inbox
                  {submittedRequestsCount > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0049ff] text-[10px] font-bold text-white shrink-0 select-none">
                      {submittedRequestsCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">Your recent requests</p>
              </div>
              <Link href="/client/requests" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {recentRequests.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-2xl">
                  No requests submitted yet.
                </div>
              ) : (
                recentRequests.map((r) => {
                  const meta = REQUEST_STATUS_META[r.status];
                  return (
                    <Link
                      key={r.id}
                      href="/client/requests"
                      className="block rounded-2xl border border-border bg-background p-3 hover:border-primary/40 transition-all cursor-pointer"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
                      </div>
                      <div className="line-clamp-1 text-sm font-medium">{r.title}</div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default PortalHome;
