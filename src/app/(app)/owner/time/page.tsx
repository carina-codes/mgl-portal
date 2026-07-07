"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange, type FilterOption, type FilterDef } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { Plus, Pencil, Clock, Coins, TrendingUp, Search, Trash2, FileDown, MoreHorizontal } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

function TimePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const allEntries = useStore((s) => s.timeEntries);
  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const memberParam = searchParams.get("member");
  const projectParam = searchParams.get("project");
  const clientParam = searchParams.get("client");

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    if (memberParam) initial.member = [memberParam];
    if (projectParam) initial.project = [projectParam];
    if (clientParam) initial.client = [clientParam];
    return initial;
  });

  useEffect(() => {
    if (memberParam) {
      setFilters((prev) => ({ ...prev, member: [memberParam] }));
    }
    if (projectParam) {
      setFilters((prev) => ({ ...prev, project: [projectParam] }));
    }
    if (clientParam) {
      setFilters((prev) => ({ ...prev, client: [clientParam] }));
    }
  }, [memberParam, projectParam, clientParam]);

  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  useEffect(() => {
    if (!filters.project || filters.project.length === 0) {
      if (filters.task && filters.task.length > 0) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.task;
          return next;
        });
      }
    }
  }, [filters.project, filters.task]);

  const filterDefs = useMemo(
    () => {
      const defs: FilterDef[] = [
        {
          id: "client",
          label: "Client",
          multi: true,
          options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
        },
        {
          id: "project",
          label: "Project",
          multi: true,
          options: projects.map((p) => ({ value: p.id, label: p.name })),
        },
        {
          id: "member",
          label: "Team",
          multi: true,
          options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })),
        },
      ];

      if (filters.project && filters.project.length > 0) {
        const selectedProjectIds = filters.project;
        const projectTasks = tasks.filter((t) => selectedProjectIds.includes(t.projectId));
        defs.push({
          id: "task",
          label: "Task",
          multi: true,
          options: projectTasks.map((t) => ({ value: t.id, label: t.title })),
        });
      }

      defs.push({
        id: "billable",
        label: "Billable",
        options: [
          { value: "yes", label: "Billable" },
          { value: "no", label: "Non-billable" },
        ] as FilterOption[],
      });

      return defs;
    },
    [users, projects, clients, tasks, filters.project],
  );

  const filtered = allEntries.filter((e) => {
    const project = projects.find((p) => p.id === e.projectId);
    if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.member?.length && !filters.member.includes(e.userId)) return false;
    if (filters.project?.length && !filters.project.includes(e.projectId)) return false;
    if (filters.task?.length && (!e.taskId || !filters.task.includes(e.taskId))) return false;
    if (filters.client?.length && (!project || !filters.client.includes(project.clientId))) return false;
    if (filters.billable?.length) {
      const v = filters.billable[0];
      if (v === "yes" && !e.billable) return false;
      if (v === "no" && e.billable) return false;
    }
    if (!inRange(e.date, dateRange)) return false;
    return true;
  });

  const total = useMemo(() => {
    if (!mounted) return 0;
    return filtered.reduce((s, t) => s + t.hours, 0);
  }, [filtered, mounted]);

  const billable = useMemo(() => {
    if (!mounted) return 0;
    return filtered.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);
  }, [filtered, mounted]);

  return (
    <AppShell
      title="Time tracking"
      subtitle="Hours across the studio"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4 text-muted-foreground" /> Export to PDF
          </button>
          <button
            onClick={() => open("time.log")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Log time
          </button>
        </div>
      }
    >
      {/* Stats Cards Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Logged Card */}
        <div className="panel p-5 bg-card border-border/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hours Logged</div>
            <div className="mt-1 text-2xl font-bold text-foreground" suppressHydrationWarning>{total.toFixed(1)}h</div>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Billable Card */}
        <div className="panel p-5 bg-card border-border/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Billable Hours</div>
            <div className="mt-1 text-2xl font-bold text-foreground" suppressHydrationWarning>{billable.toFixed(1)}h</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* Utilization Card */}
        <div className="panel p-5 bg-card border-border/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Utilization</div>
            <div className="mt-1 text-2xl font-bold text-foreground" suppressHydrationWarning>
              {total ? Math.round((billable / total) * 100) : 0}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search notes…"
          filters={filterDefs}
          values={filters}
          onChange={setFilters}
          dateRange={dateRange}
          onDateRange={setDateRange}
        />

        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Note / Work Done</th>
                  <th className="px-5 py-3 font-medium text-right">Hours</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {mounted && filtered.slice(0, 80).map((e) => {
                  const u = users.find((x) => x.id === e.userId);
                  const p = projects.find((x) => x.id === e.projectId);
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground font-medium whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                          {u && <UserAvatar user={u} size={24} />}
                          <span className="text-foreground font-semibold">{u?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p ? (
                          <Link href={`/owner/projects/${p.id}`} className="hover:text-primary transition-colors font-medium">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground/50">General</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground font-medium">
                        {e.note || <span className="italic text-muted-foreground/30 font-normal">No note provided</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground font-semibold">
                        {e.hours.toFixed(1)}h
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", e.billable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/10")}>
                          {e.billable ? "Billable" : "Non-billable"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-full border border-border/50 bg-background/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 border border-border bg-card">
                            <DropdownMenuItem
                              onSelect={(ev) => {
                                ev.preventDefault();
                                setTimeout(() => open("time.edit", { timeId: e.id }), 100);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(ev) => {
                                ev.preventDefault();
                                setTimeout(() => open("time.delete", { timeId: e.id }), 100);
                              }}
                              className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                            >
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {(!mounted || filtered.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      {mounted ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                            <Search className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-semibold text-foreground">No time entries match your filters</div>
                          <div className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
                            Try adjusting search note queries or filters.
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center py-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TimePageWrapper() {
  return (
    <Suspense fallback={null}>
      <TimePage />
    </Suspense>
  );
}

export default TimePageWrapper;
