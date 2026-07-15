"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { UserAvatar } from "@/components/user-avatar";
import { useModals } from "@/components/modals";
import { useCurrentUser } from "@/lib/role-context";
import {
  clients,
  requests,
  users,
  REQUEST_STATUS_META,
} from "@/lib/mock-data";
import {
  TrendingUp,
  Inbox,
  Clock,
  Plus,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  FileUp,
  PlusCircle,
  Calendar,
  CircleDot,
} from "lucide-react";
import { projects } from "@/lib/mock-data";

const ACTIVITY_FEED = [
  { id: "act-1", date: "Today, 11:22 AM", type: "comment", user: "Marcus Hale", project: "Halcyon CarePortal Support", projectId: "p8", details: "Posted comment: 'Thanks team, onboarding flow looks excellent.'" },
  { id: "act-2", date: "Today, 10:45 AM", type: "status", user: "Mia Tanaka", project: "NovaBoard Mobile App", projectId: "p1", taskName: "Draft Wireframes", details: "Changed status of task 'Draft Wireframes' to 'In Review'" },
  { id: "act-3", date: "Yesterday, 04:30 PM", type: "file", user: "Ava Lindgren", project: "NovaBoard Mobile App", projectId: "p1", details: "Uploaded file 'dashboard-v3-final.fig'" },
  { id: "act-4", date: "Yesterday, 02:15 PM", type: "task_add", user: "Carina Rivera", project: "Halcyon CarePortal Support", projectId: "p8", taskName: "Integrate billing webhook endpoint", details: "Added task: 'Integrate billing webhook endpoint'" },
  { id: "act-5", date: "Yesterday, 10:15 AM", type: "dates", user: "Devon Patel", project: "Arcadia Marketing Site Refresh", projectId: "p2", details: "Rescheduled launch date from Jun 28 to Jul 05" },
  { id: "act-6", date: "Jun 11, 04:12 PM", type: "comment", user: "Marcus Hale", project: "NovaBoard Mobile App", projectId: "p1", details: "Posted comment: 'Looks solid, let's proceed with design revisions.'" },
  { id: "act-7", date: "Jun 10, 02:45 PM", type: "status", user: "Devon Patel", project: "NovaBoard Mobile App", projectId: "p1", taskName: "Asset Compilation", details: "Changed status of task 'Asset Compilation' to 'Completed'" },
  { id: "act-8", date: "Jun 10, 09:30 AM", type: "file", user: "Mia Tanaka", project: "Arcadia Marketing Site Refresh", projectId: "p2", details: "Uploaded file 'landing-page-v2.png'" },
  { id: "act-9", date: "Jun 09, 05:00 PM", type: "task_add", user: "Ava Lindgren", project: "NovaBoard Mobile App", projectId: "p1", taskName: "Database migration scripts", details: "Added task: 'Database migration scripts'" },
  { id: "act-10", date: "Jun 09, 11:15 AM", type: "dates", user: "Carina Rivera", project: "NovaBoard Mobile App", projectId: "p1", details: "Rescheduled kickoff date from Jun 12 to Jun 15" },
  { id: "act-11", date: "Jun 08, 02:30 PM", type: "comment", user: "Mia Tanaka", project: "Northwind Brand System", projectId: "p4", details: "Posted comment: 'Primary color palette updated in Figma files.'" },
];

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

export default function Dashboard() {
  const { open } = useModals();
  const user = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const greeting = useGreeting();
  const activeProjects = projects.filter((p) => p.status !== "completed").length;
  const openRequests = requests.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const submittedRequestsCount = requests.filter((r) => r.status === "submitted").length;
  const recentRequests = requests.slice(0, 5);

  return (
    <AppShell
      title={`${greeting}, ${firstName}`}
      subtitle="Here's what's moving across the workspace today"
      actions={
        <button
          onClick={() => open("project.new")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard
          label="Active projects"
          value={activeProjects}
          icon={TrendingUp}
          trend={{ value: "+2 this month", positive: true }}
          color="purple"
          sparklineData={[12, 14, 13, 15, 17, 16, 18]}
          delay={0}
        />
        <KpiCard
          label="Open requests"
          value={openRequests}
          icon={Inbox}
          trend={{ value: "3 review items", positive: false }}
          color="amber"
          sparklineData={[5, 4, 6, 3, 2, 4, 3]}
          delay={100}
        />
        <KpiCard
          label="Hours this week"
          value="186"
          icon={Clock}
          trend={{ value: "+12% vs last week", positive: true }}
          color="blue"
          sparklineData={[160, 165, 170, 180, 175, 182, 186]}
          delay={200}
        />
      </div>



      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Latest Activity */}
        <div className="xl:col-span-2 panel p-6">
          <div className="mb-[25px] flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Latest activity</h2>
              <p className="text-xs text-muted-foreground">Live project momentum & team velocity</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {ACTIVITY_FEED.map((act) => {
              const Icon = {
                comment: MessageSquare,
                status: CheckCircle2,
                file: FileUp,
                task_add: PlusCircle,
                dates: Calendar,
              }[act.type] || CircleDot;

              const iconCls = {
                comment: "bg-blue-500/10 text-blue-500",
                status: "bg-emerald-500/10 text-emerald-500",
                file: "bg-purple-500/10 text-purple-500",
                task_add: "bg-pink-500/10 text-pink-500",
                dates: "bg-amber-500/10 text-amber-500",
              }[act.type] || "bg-muted text-muted-foreground";

              return (
                <Link
                  key={act.id}
                  href={`/owner/projects/${act.projectId}?tab=${
                    {
                      comment: "chat",
                      status: "tasks",
                      file: "files",
                      task_add: "tasks",
                      dates: "overview",
                    }[act.type] || "overview"
                  }`}
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
            })}
          </div>
        </div>

        {/* Right column: Message Inbox & Request Inbox */}
        <div className="flex flex-col gap-6 h-full">
          {/* Message Inbox */}
          <div className="panel p-6 flex-1 flex flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Message inbox
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0049ff] text-[10px] font-bold text-white shrink-0 select-none">
                    3
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">Unread thread mentions</p>
              </div>
              <Link href="/owner/messages" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>
            
            <div className="space-y-3 flex-1">
              {MESSAGE_INBOX.map((msg) => {
                const sender = users.find((u) => u.name === msg.user);
                return (
                  <Link key={msg.id} href="/owner/messages" className="flex gap-3 p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 transition-all">
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
              })}
            </div>
          </div>

          {/* Request Inbox */}
          <div className="panel p-6 flex-1 flex flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Request inbox
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0049ff] text-[10px] font-bold text-white shrink-0 select-none">
                    {submittedRequestsCount}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">Awaiting your call</p>
              </div>
              <Link href="/owner/requests" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>
            <div className="space-y-3 flex-1">
              {recentRequests.map((r) => {
                const meta = REQUEST_STATUS_META[r.status];
                return (
                  <Link
                    key={r.id}
                    href={`/owner/requests?requestId=${r.id}`}
                    className="block rounded-2xl border border-border bg-background p-3 hover:border-primary/40 transition-all cursor-pointer"
                  >
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
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
