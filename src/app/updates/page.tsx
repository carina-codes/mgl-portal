"use client";

import { AppShell } from "@/components/app-shell";
import { useRole } from "@/lib/role-context";
import {
  Sparkles,
  Wrench,
  Bug,
  Send,
  MessageSquare,
  Clock,
  FolderKanban,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UpdateTag = "new" | "improved" | "fixed";

const TAG_META: Record<UpdateTag, { label: string; icon: typeof Sparkles; cls: string }> = {
  new: { label: "New", icon: Sparkles, cls: "bg-primary/10 text-primary" },
  improved: { label: "Improved", icon: Wrench, cls: "bg-blue-500/10 text-blue-600" },
  fixed: { label: "Fixed", icon: Bug, cls: "bg-emerald-500/10 text-emerald-600" },
};

interface UpdateEntry {
  date: string;
  title: string;
  tags: UpdateTag[];
  icon: typeof Sparkles;
  details: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    date: "July 21, 2026",
    title: "Support contact refresh",
    tags: ["improved"],
    icon: MessageSquare,
    details: [
      "Updated the support email across the portal footer so requests route to the right inbox.",
    ],
  },
  {
    date: "July 14, 2026",
    title: "Faster request triage",
    tags: ["improved"],
    icon: Send,
    details: [
      "Request inbox now surfaces submitted items first so nothing waits longer than it should.",
      "Status badges recolored for quicker scanning across owner, team, and client views.",
    ],
  },
  {
    date: "July 2, 2026",
    title: "Time tracking polish",
    tags: ["improved", "fixed"],
    icon: Clock,
    details: [
      "Weekly hours now roll up correctly when entries span a month boundary.",
      "Fixed a rounding issue that occasionally showed totals a few minutes off.",
    ],
  },
  {
    date: "June 20, 2026",
    title: "Task boards for team members",
    tags: ["new"],
    icon: ListTodo,
    details: [
      "Team portal now includes a dedicated Tasks view, separate from the shared project board.",
      "Managers can filter tasks by assignee, project, or due date.",
    ],
  },
  {
    date: "June 8, 2026",
    title: "Project activity feed",
    tags: ["new"],
    icon: FolderKanban,
    details: [
      "Added a live activity feed to the owner dashboard covering comments, uploads, status changes, and rescheduled dates.",
    ],
  },
];

export default function UpdatesPage() {
  const { role: contextRole } = useRole();
  const role = contextRole === "manager" ? "team" : contextRole;

  return (
    <AppShell
      role={role}
      title="Updates"
      subtitle="What's new and improved across the MGL Portal"
    >
      <div className="space-y-5">
        {UPDATES.map((entry) => {
          const Icon = entry.icon;
          return (
            <div key={entry.title} className="panel p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{entry.title}</h2>
                    {entry.tags.map((tag) => {
                      const meta = TAG_META[tag];
                      const TagIcon = meta.icon;
                      return (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            meta.cls,
                          )}
                        >
                          <TagIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{entry.date}</div>
                  <ul className="mt-3 space-y-1.5">
                    {entry.details.map((detail, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
