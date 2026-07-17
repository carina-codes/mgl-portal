"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { UserAvatar } from "@/components/user-avatar";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { useStore } from "@/lib/store";
import { STAGE_META } from "@/lib/mock-data";
import {
  TrendingUp,
  ListTodo,
  Clock,
  MessageSquare,
  CheckCircle2,
  FileUp,
  PlusCircle,
  Calendar,
  CircleDot,
} from "lucide-react";

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
  { id: "msg-1", user: "Marcus Hale", project: "NovaBoard Mobile App", text: "@team the gradient on the onboarding screen feels too saturated — can we soften it?", time: "10m ago" },
  { id: "msg-2", user: "Carina Rivera", project: "Halcyon CarePortal Support", text: "Can you check the billing rate on the Halcyon Ventures client card?", time: "2h ago" },
  { id: "msg-3", user: "Ava Lindgren", project: "Arcadia Marketing Site Refresh", text: "The wireframes for the user onboarding are complete, ready for review.", time: "1d ago" },
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

function TeamPortalHome() {
  const { member } = useActiveTeamMember();
  const greeting = useGreeting();
  const allProjects = useStore((s) => s.projects);
  const allTasks = useStore((s) => s.tasks);
  const users = useStore((s) => s.users);
  const timeEntries = useStore((s) => s.timeEntries);

  const firstName = member.name.split(" ")[0] || "there";
  const myProjects = allProjects.filter((p) => p.team.includes(member.id));
  const myProjectIds = myProjects.map((p) => p.id);
  const myProjectNames = new Set(myProjects.map((p) => p.name));

  const activeProjects = myProjects.filter((p) => p.status !== "completed").length;
  const myTasks = allTasks.filter((t) => t.assignees.includes(member.id));
  const openTasks = myTasks.filter((t) => t.stage !== "completed").length;
  const inReviewTasks = myTasks.filter((t) => t.stage === "in_review").length;
  const recentTasks = myTasks.filter((t) => t.stage !== "completed").slice(0, 5);
  const myTimeEntries = timeEntries.filter((e) => e.userId === member.id);
  const hoursLogged = myTimeEntries.reduce((sum, e) => sum + e.hours, 0);
  const hoursThisWeek = myTimeEntries
    .filter((e) => e.date.includes("2026")) // demo data — all entries counted as recent
    .slice(0, 7)
    .reduce((sum, e) => sum + e.hours, 0);

  // Scoped to this member's own projects only.
  const myActivity = ACTIVITY_FEED.filter((a) => myProjectNames.has(a.project));
  const myMessages = MESSAGE_INBOX.filter((m) => myProjectNames.has(m.project));

  return (
    <AppShell
      role="team"
      title={`${greeting}, ${firstName}`}
      subtitle={`Here's what's moving across your ${myProjects.length} ${myProjects.length === 1 ? "project" : "projects"}`}
      actions={
        <Link
          href="/team/tasks"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <ListTodo className="h-4 w-4" /> View tasks
        </Link>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard
          label="My projects"
          value={activeProjects}
          icon={TrendingUp}
          trend={{ value: `${myProjects.length} total`, positive: true }}
          color="purple"
          sparklineData={[12, 14, 13, 15, 17, 16, 18]}
          delay={0}
          href="/team/projects"
        />
        <KpiCard
          label="Open tasks"
          value={openTasks}
          icon={ListTodo}
          trend={{ value: `${inReviewTasks} in review`, positive: false }}
          color="amber"
          sparklineData={[5, 4, 6, 3, 2, 4, 3]}
          delay={100}
          href="/team/tasks"
        />
        <KpiCard
          label="Hours logged"
          value={hoursLogged}
          icon={Clock}
          trend={{ value: "Across your projects", positive: true }}
          color="blue"
          sparklineData={[160, 165, 170, 180, 175, 182, 186]}
          delay={200}
          href="/team/time"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Latest Activity */}
        <div className="xl:col-span-2 panel p-6">
          <div className="mb-[25px] flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Latest activity</h2>
              <p className="text-xs text-muted-foreground">Updates across your projects</p>
            </div>
          </div>

          <div className="space-y-4">
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
                    href={`/team/projects/${act.projectId}`}
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

        {/* Right column: Message Inbox & Task Inbox */}
        <div className="flex flex-col gap-6 h-full">
          {/* Message Inbox */}
          <div className="panel p-6 flex-1 flex flex-col">
            <div className="mb-4 flex items-start justify-between">
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
              <Link href="/team/messages" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>

            <div className="space-y-3 flex-1">
              {myMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-2xl">
                  No messages yet.
                </div>
              ) : (
                myMessages.map((msg) => {
                  const sender = users.find((u) => u.name === msg.user);
                  return (
                    <Link key={msg.id} href="/team/messages" className="flex gap-3 p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 transition-all">
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

          {/* Task Inbox */}
          <div className="panel p-6 flex-1 flex flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  My open tasks
                  {openTasks > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0049ff] text-[10px] font-bold text-white shrink-0 select-none">
                      {openTasks}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">Assigned to you</p>
              </div>
              <Link href="/team/tasks" className="text-sm font-medium text-primary hover:underline">
                All →
              </Link>
            </div>
            <div className="space-y-3 flex-1">
              {recentTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-2xl">
                  No open tasks assigned to you.
                </div>
              ) : (
                recentTasks.map((t) => {
                  const meta = STAGE_META[t.stage];
                  const proj = allProjects.find((p) => p.id === t.projectId);
                  return (
                    <Link
                      key={t.id}
                      href={`/team/projects/${t.projectId}`}
                      className="block rounded-2xl border border-border bg-background p-3 hover:border-primary/40 transition-all cursor-pointer"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border/10 ${meta.tone} ${meta.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{t.dueDate}</span>
                      </div>
                      <div className="line-clamp-1 text-sm font-medium">{t.title}</div>
                      {proj && <div className="mt-1 text-[10px] text-muted-foreground">{proj.name}</div>}
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

export default TeamPortalHome;
