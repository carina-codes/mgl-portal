"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange, type FilterOption, type FilterDef } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { useModals } from "@/components/modals";
import { Plus, Clock, Coins, TrendingUp, Search, FileDown } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { useState, useMemo, useEffect } from "react";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

type TimeSortField = "date" | "member" | "project" | "hours" | "billable";

function TeamTimePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { member, isManager } = useActiveTeamMember();
  const { open } = useModals();
  const allEntries = useStore((s) => s.timeEntries);
  const allProjects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [sortBy, setSortBy] = useState<TimeSortField>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: TimeSortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const myProjects = useMemo(() => allProjects.filter((p) => p.team.includes(member.id)), [allProjects, member.id]);
  const myProjectIds = useMemo(() => new Set(myProjects.map((p) => p.id)), [myProjects]);

  // Managers see everyone's logged time across their projects; regular team
  // members only see their own entries.
  const scopedEntries = useMemo(() => {
    return isManager ? allEntries.filter((e) => myProjectIds.has(e.projectId)) : allEntries.filter((e) => e.userId === member.id);
  }, [allEntries, isManager, myProjectIds, member.id]);

  const teamMembersOnMyProjects = useMemo(() => {
    const ids = new Set<string>();
    myProjects.forEach((p) => p.team.forEach((id) => ids.add(id)));
    return users.filter((u) => ids.has(u.id));
  }, [myProjects, users]);

  const filterDefs = useMemo(() => {
    const defs: FilterDef[] = [];
    if (isManager) {
      defs.push({
        id: "client",
        label: "Client",
        multi: true,
        options: Array.from(new Set(myProjects.map((p) => p.clientId)))
          .map((id) => clients.find((c) => c.id === id))
          .filter((c): c is NonNullable<typeof c> => !!c)
          .map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
      });
      defs.push({
        id: "member",
        label: "Team",
        multi: true,
        options: teamMembersOnMyProjects.map((u) => ({ value: u.id, label: u.name, color: u.color })),
      });
    }
    defs.push({
      id: "project",
      label: "Project",
      multi: true,
      options: myProjects.map((p) => ({ value: p.id, label: p.name })),
    });
    if (filters.project && filters.project.length > 0) {
      const projectTasks = tasks.filter((t) => filters.project!.includes(t.projectId));
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
  }, [isManager, myProjects, clients, teamMembersOnMyProjects, tasks, filters.project]);

  const filtered = useMemo(() => {
    const result = scopedEntries.filter((e) => {
      const project = allProjects.find((p) => p.id === e.projectId);
      if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.client?.length && (!project || !filters.client.includes(project.clientId))) return false;
      if (filters.member?.length && !filters.member.includes(e.userId)) return false;
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

    return [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === "member") {
        valA = users.find((u) => u.id === a.userId)?.name || "";
        valB = users.find((u) => u.id === b.userId)?.name || "";
      } else if (sortBy === "project") {
        valA = allProjects.find((p) => p.id === a.projectId)?.name || "";
        valB = allProjects.find((p) => p.id === b.projectId)?.name || "";
      } else if (sortBy === "hours") {
        valA = a.hours;
        valB = b.hours;
      } else if (sortBy === "billable") {
        valA = a.billable ? 1 : 0;
        valB = b.billable ? 1 : 0;
      } else {
        valA = new Date(a.date).getTime() || 0;
        valB = new Date(b.date).getTime() || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [scopedEntries, allProjects, users, search, filters, dateRange, sortBy, sortOrder]);

  const total = useMemo(() => (mounted ? filtered.reduce((s, t) => s + t.hours, 0) : 0), [filtered, mounted]);
  const billableHours = useMemo(() => (mounted ? filtered.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0) : 0), [filtered, mounted]);

  return (
    <AppShell
      role="team"
      title="Time tracking"
      subtitle={isManager ? "Hours logged by your team across your projects" : "Your hours across assigned projects"}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4 text-muted-foreground" /> Export to PDF
          </button>
          <button
            onClick={() => open("time.log", { userId: member.id })}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Log time
          </button>
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <KpiCard label="Hours Logged" value={`${parseFloat(total.toFixed(2))}h`} icon={Clock} color="blue" delay={0} sparklineData={[120, 135, 125, 148, 150, 160, 168]} />
        <KpiCard label="Billable Hours" value={`${parseFloat(billableHours.toFixed(2))}h`} icon={Coins} color="green" delay={100} sparklineData={[90, 110, 105, 120, 130, 138, 144]} />
        <KpiCard label="Utilization" value={`${total ? Math.round((billableHours / total) * 100) : 0}%`} icon={TrendingUp} color="purple" delay={200} progress={total ? Math.round((billableHours / total) * 100) : 0} />
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
                  <th onClick={() => handleSort("date")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  {isManager && (
                    <th onClick={() => handleSort("member")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Team {sortBy === "member" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  <th onClick={() => handleSort("project")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Project {sortBy === "project" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 font-medium select-none">Note / Work Done</th>
                  <th onClick={() => handleSort("hours")} className="px-5 py-3 font-medium text-right cursor-pointer hover:text-foreground select-none">
                    Hours {sortBy === "hours" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("billable")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                    Status {sortBy === "billable" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mounted && filtered.slice(0, 80).map((e) => {
                  const p = allProjects.find((x) => x.id === e.projectId);
                  const u = users.find((x) => x.id === e.userId);
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground font-medium whitespace-nowrap">{formatDate(e.date)}</td>
                      {isManager && (
                        <td className="px-5 py-3 text-muted-foreground">
                          {u && (
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={u} size={24} />
                              <span className="text-foreground font-semibold">{u.name}</span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3 text-muted-foreground">
                        {p ? (
                          <Link href={`/team/projects/${p.id}`} className="hover:text-primary transition-colors font-medium">
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
                    <td colSpan={isManager ? 6 : 5} className="px-5 py-12 text-center">
                      {mounted ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                            <Search className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-semibold text-foreground">No time entries match your filters</div>
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

export default TeamTimePage;
