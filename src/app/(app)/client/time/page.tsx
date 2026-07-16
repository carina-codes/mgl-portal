"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange, type FilterOption, type FilterDef } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import { FileDown, Clock, Coins, TrendingUp, Search } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { useState, useMemo, useEffect } from "react";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

function PortalTime() {
  const { client } = useActiveClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allEntries = useStore((s) => s.timeEntries);
  const users = useStore((s) => s.users);
  const allProjects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const myProjects = useMemo(() => allProjects.filter((p) => p.clientId === client.id), [allProjects, client.id]);
  const myProjectIds = useMemo(() => new Set(myProjects.map((p) => p.id)), [myProjects]);
  const myEntries = useMemo(() => allEntries.filter((e) => myProjectIds.has(e.projectId)), [allEntries, myProjectIds]);

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

  const filterDefs = useMemo(() => {
    const defs: FilterDef[] = [
      { id: "project", label: "Project", multi: true, options: myProjects.map((p) => ({ value: p.id, label: p.name })) },
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
  }, [myProjects, tasks, filters.project]);

  const filtered = myEntries.filter((e) => {
    if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.project?.length && !filters.project.includes(e.projectId)) return false;
    if (filters.task?.length && (!e.taskId || !filters.task.includes(e.taskId))) return false;
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
      role="client"
      title="Time"
      subtitle="Hours logged across your projects"
      actions={
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.print();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all cursor-pointer"
        >
          <FileDown className="h-4 w-4 text-muted-foreground" /> Export to PDF
        </button>
      }
    >
      {/* Stats Cards Section */}
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard
          label="Hours Logged"
          value={`${parseFloat(total.toFixed(2))}h`}
          icon={Clock}
          color="blue"
          delay={0}
          sparklineData={[120, 135, 125, 148, 150, 160, 168]}
        />
        <KpiCard
          label="Billable Hours"
          value={`${parseFloat(billable.toFixed(2))}h`}
          icon={Coins}
          color="green"
          delay={100}
          sparklineData={[90, 110, 105, 120, 130, 138, 144]}
        />
        <KpiCard
          label="Utilization"
          value={`${total ? Math.round((billable / total) * 100) : 0}%`}
          icon={TrendingUp}
          color="purple"
          delay={200}
          progress={total ? Math.round((billable / total) * 100) : 0}
        />
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
                </tr>
              </thead>
              <tbody>
                {mounted && filtered.slice(0, 80).map((e) => {
                  const u = users.find((x) => x.id === e.userId);
                  const p = myProjects.find((x) => x.id === e.projectId);
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
                          <Link href={`/client/projects/${p.id}`} className="hover:text-primary transition-colors font-medium">
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
                        {parseFloat(e.hours.toFixed(2))}h
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", e.billable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/10")}>
                          {e.billable ? "Billable" : "Non-billable"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!mounted || filtered.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
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

export default PortalTime;
