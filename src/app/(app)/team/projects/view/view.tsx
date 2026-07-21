"use client";

import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { useStore, useProjects } from "@/lib/store";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { useModals } from "@/components/modals";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META } from "@/lib/mock-data";
import { ArrowLeft, Edit2, LayoutDashboard, ListTodo, Inbox, Folder, MessageCircle, Clock } from "lucide-react";
import {
  Overview,
  TasksTab,
  RequestsTab,
  DocumentsTab,
  ChatTab,
  TimeTab,
  TaskDetailsDrawer,
} from "@/app/(app)/owner/projects/view/view";
import { RequestDetailsDrawer } from "@/app/(app)/owner/requests/page";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Files", icon: Folder },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "time", label: "Time", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function TeamProjectDetail() {
  const { open } = useModals();
  const { member, isManager } = useActiveTeamMember();

  const projects = useProjects();
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const allTasks = useStore((s) => s.tasks);

  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") as string;
  const tabParam = searchParams.get("tab") as TabId;

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const client = useMemo(() => (project ? clients.find((c) => c.id === project.clientId) : undefined), [clients, project]);
  // Header avatars, and access to this page, include everyone actively
  // contributing — management plus anyone assigned to a task here.
  const projectMemberIds = useMemo(() => {
    if (!project) return [];
    const taskAssignees = allTasks.filter((t) => t.projectId === project.id).flatMap((t) => t.assignees);
    return Array.from(new Set([...project.team, ...taskAssignees]));
  }, [project, allTasks]);
  const [tab, setTab] = useState<TabId>(() => tabParam || "overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);

  if (!project) throw notFound();
  if (!client) throw notFound();
  if (!projectMemberIds.includes(member.id)) throw notFound();

  return (
    <AppShell role="team">
      <Link href="/team/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="panel p-6 bg-card/50 backdrop-blur-sm border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "grid h-14 w-14 place-items-center rounded-full text-2xl font-bold border transition-all duration-300",
              {
                todo: "bg-todo text-todo-foreground border-todo-foreground/20",
                progress: "bg-progress text-progress-foreground border-progress-foreground/20",
                review: "bg-review text-review-foreground border-review-foreground/20",
                done: "bg-done text-done-foreground border-done-foreground/20",
              }[project.accent] || "bg-muted text-muted-foreground border-muted-foreground/20"
            )}>
              {project.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{client.name}</span> · Timeline:{" "}
                <span className="font-medium text-foreground">{project.startDate} – {project.endDate}</span>
                <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[project.status].cls}`}>
                  {PROJECT_STATUS_META[project.status].label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvatarStack userIds={projectMemberIds} users={users} max={4} size={32} />
            {isManager && (
              <button
                onClick={() => open("project.edit", { projectId: project.id })}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 mb-6 flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {tab === "overview" && <Overview projectId={project.id} />}
        {tab === "tasks" && <TasksTab projectId={project.id} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} />}
        {tab === "requests" && <RequestsTab projectId={project.id} onSelectRequest={setSelectedRequestId} />}
        {tab === "files" && <DocumentsTab projectId={project.id} />}
        {tab === "chat" && <ChatTab projectId={project.id} onOpenTask={setSelectedTaskId} authorId={member.id} />}
        {tab === "time" && <TimeTab projectId={project.id} onTaskClick={setSelectedTaskId} basePath="/team" authorId={member.id} scopeToAuthor />}
      </div>

      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} hideDiscussion={tab === "chat"} authorId={member.id} />
      <RequestDetailsDrawer requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} authorId={member.id} />
    </AppShell>
  );
}

export default TeamProjectDetail;
