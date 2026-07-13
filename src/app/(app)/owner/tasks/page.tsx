"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { useModals } from "@/components/modals";
import { Search, FolderOpen, Calendar, AlertCircle, CheckCircle2, Circle, MoreHorizontal } from "lucide-react";
import { TaskDetailsDrawer } from "@/app/(app)/owner/projects/[projectId]/view";
import { FilterBar, type FilterDef } from "@/components/filter-bar";
import { AvatarStack } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Priority meta matching the rest of the application
const PRIORITY_META = {
  low: { label: "Low", cls: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/10" },
  medium: { label: "Medium", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20" },
  high: { label: "High", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20" },
  urgent: { label: "Urgent", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20" },
};

const STAGE_META = {
  todo: { label: "To Do", pill: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400" },
  in_progress: { label: "In Progress", pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  in_review: { label: "In Review", pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  completed: { label: "Completed", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
};

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const { open } = useModals();

  // The owner is Carina Rivera, user ID "u1"
  const currentUserId = "u1";

  // Filter tasks to show only those assigned to the current user
  const assignedTasks = useMemo(() => {
    return allTasks.filter((t) => t.assignees.includes(currentUserId));
  }, [allTasks, currentUserId]);

  const filterDefs = useMemo(() => {
    return [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: [
          { value: "todo", label: "To Do" },
          { value: "in_progress", label: "In Progress" },
          { value: "in_review", label: "In Review" },
          { value: "completed", label: "Completed" },
        ],
      },
      {
        id: "priority",
        label: "Priority",
        multi: true,
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "urgent", label: "Urgent" },
        ],
      },
      {
        id: "project",
        label: "Project",
        multi: true,
        options: projects.map((p) => ({ value: p.id, label: p.name })),
      },
    ];
  }, [projects]);

  const filteredTasks = useMemo(() => {
    return assignedTasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.note?.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.status?.length && !filters.status.includes(t.stage)) return false;
      if (filters.priority?.length && !filters.priority.includes(t.priority)) return false;
      if (filters.project?.length && !filters.project.includes(t.projectId)) return false;
      return true;
    });
  }, [assignedTasks, query, filters]);

  if (!mounted) return null;

  return (
    <AppShell
      title="Assigned Tasks"
      subtitle="List of all project tasks assigned to you."
    >
      <div className="space-y-6">

        {/* Controls */}
        <FilterBar
          search={query}
          onSearch={setQuery}
          placeholder="Search tasks…"
          filters={filterDefs}
          values={filters}
          onChange={setFilters}
        />

        {/* List Section */}
        <div className="panel overflow-hidden">
          {filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 font-medium">Task</th>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Due Date</th>
                    <th className="px-5 py-3 font-medium">Assignees</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const project = projects.find((p) => p.id === t.projectId);
                    const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                    const smeta = STAGE_META[t.stage] ?? STAGE_META.todo;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            {t.stage === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskId(t.id);
                              }}
                              className={cn(
                                "hover:text-primary transition-colors text-left font-medium",
                                t.stage === "completed" && "line-through text-muted-foreground"
                              )}
                            >
                              {t.title}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {project ? (
                            <Link
                              href={`/owner/projects/${project.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-primary transition-colors font-medium flex items-center gap-1"
                            >
                              <FolderOpen className="h-3.5 w-3.5" /> {project.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", smeta.pill)}>
                            {smeta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pmeta.cls)}>
                            {pmeta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {t.dueDate || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <AvatarStack userIds={t.assignees} users={users} max={3} size={22} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedTaskId(t.id)}
                              className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-semibold">No assigned tasks found</p>
              <p className="text-xs mt-1">Try refining your search query.</p>
            </div>
          )}
        </div>
      </div>

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </AppShell>
  );
}
