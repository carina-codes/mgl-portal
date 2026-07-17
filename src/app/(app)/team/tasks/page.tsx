"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { Search, FolderOpen, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { TaskDetailsDrawer } from "@/app/(app)/owner/projects/[projectId]/view";
import { FilterBar } from "@/components/filter-bar";
import { AvatarStack } from "@/components/user-avatar";
import { PRIORITY_META, STAGE_META } from "@/lib/mock-data";

/** Chronological sort key for a task's due date — tasks without a valid due
 * date sort to the end so date-ordered views stay top-to-bottom by urgency. */
const dueDateSortValue = (dateStr?: string) => {
  if (!dateStr) return Infinity;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? Infinity : parsed.getTime();
};

const PRIORITY_SORT: Record<string, number> = { low: 1, medium: 2, high: 3 };
const STAGE_SORT: Record<string, number> = { todo: 1, in_progress: 2, in_review: 3, completed: 4 };

type SortField = "title" | "project" | "stage" | "priority" | "dueDate";

export default function TeamTasksPage() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const { member } = useActiveTeamMember();
  const allTasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);

  const assignedTasks = useMemo(() => {
    return allTasks.filter((t) => t.assignees.includes(member.id));
  }, [allTasks, member.id]);

  const myProjects = useMemo(() => projects.filter((p) => p.team.includes(member.id)), [projects, member.id]);

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
        ],
      },
      {
        id: "project",
        label: "Project",
        multi: true,
        options: myProjects.map((p) => ({ value: p.id, label: p.name })),
      },
    ];
  }, [myProjects]);

  const filteredTasks = useMemo(() => {
    const result = assignedTasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.note?.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.status?.length && !filters.status.includes(t.stage)) return false;
      if (filters.priority?.length && !filters.priority.includes(t.priority)) return false;
      if (filters.project?.length && !filters.project.includes(t.projectId)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === "dueDate") {
        valA = dueDateSortValue(a.dueDate);
        valB = dueDateSortValue(b.dueDate);
      } else if (sortBy === "priority") {
        valA = PRIORITY_SORT[a.priority] || 0;
        valB = PRIORITY_SORT[b.priority] || 0;
      } else if (sortBy === "stage") {
        valA = STAGE_SORT[a.stage] || 0;
        valB = STAGE_SORT[b.stage] || 0;
      } else if (sortBy === "project") {
        valA = projects.find((p) => p.id === a.projectId)?.name || "";
        valB = projects.find((p) => p.id === b.projectId)?.name || "";
      } else {
        valA = a.title;
        valB = b.title;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [assignedTasks, query, filters, sortBy, sortOrder, projects]);

  if (!mounted) return null;

  return (
    <AppShell
      role="team"
      title="My Tasks"
      subtitle="List of all project tasks assigned to you."
    >
      <div className="space-y-6">
        <FilterBar
          search={query}
          onSearch={setQuery}
          placeholder="Search tasks…"
          filters={filterDefs}
          values={filters}
          onChange={setFilters}
        />

        <div className="panel overflow-hidden">
          {filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th onClick={() => handleSort("title")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Task {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("project")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Project {sortBy === "project" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("stage")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Stage {sortBy === "stage" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("priority")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("dueDate")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Due Date {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-5 py-3 font-medium select-none">Assignees</th>
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
                            <span className={cn("text-left font-medium", t.stage === "completed" && "line-through text-muted-foreground")}>
                              {t.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {project ? (
                            <Link
                              href={`/team/projects/${project.id}`}
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
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border/10", smeta.tone, smeta.pill)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", smeta.dot)} />
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
        authorId={member.id}
      />
    </AppShell>
  );
}
