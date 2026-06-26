"use client";

import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange, type FilterOption, type FilterDef } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { Plus, Pencil, Clock, Coins, TrendingUp, Search, Trash2, FileDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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
  const [filters, setFilters] = useState<Record<string, string[]>>({});
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
          id: "member",
          label: "Member",
          multi: true,
          options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })),
        },
        {
          id: "project",
          label: "Project",
          multi: true,
          options: projects.map((p) => ({ value: p.id, label: p.name })),
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

      defs.push(
        {
          id: "client",
          label: "Client",
          multi: true,
          options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
        },
        {
          id: "billable",
          label: "Billable",
          options: [
            { value: "yes", label: "Billable", color: "#10B981" },
            { value: "no", label: "Non-billable" },
          ] as FilterOption[],
        }
      );

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
                  <th className="px-5 py-3 font-medium">Member</th>
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
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {u && <UserAvatar user={u} size={22} />}
                          <span className="font-semibold text-foreground/90 text-xs whitespace-nowrap">
                            {u?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center justify-center font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] whitespace-nowrap">
                          {p?.name || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs text-foreground/80 max-w-[200px] md:max-w-[300px] truncate" title={e.note}>
                          {e.note || <span className="italic text-muted-foreground/30">No note provided</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs bg-muted text-foreground/80 font-mono">
                          {e.hours.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {e.billable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                            Billable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-500/10">
                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                            Non-billable
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => open("time.edit", { timeId: e.id })}
                            className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => open("time.delete", { timeId: e.id })}
                            className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                        </div>
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

export default TimePage;
