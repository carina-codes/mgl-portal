"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { PROJECT_STATUS_META } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import { FilterBar, inRange } from "@/components/filter-bar";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function PortalProjects() {
  const { client } = useActiveClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const allProjects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const myProjects = useMemo(() => allProjects.filter((p) => p.clientId === client.id), [allProjects, client.id]);

  const filterDefs = useMemo(
    () => [
      { id: "status", label: "Status", multi: true, options: Object.entries(PROJECT_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })) },
      { id: "type", label: "Type", options: [{ value: "fixed", label: "Fixed bid" }, { value: "hourly", label: "Hourly" }, { value: "retainer", label: "Retainer" }] },
    ],
    [],
  );

  const filtered = myProjects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(p.status)) return false;
    if (filters.type?.length && !filters.type.includes(p.type)) return false;
    if (!inRange(p.startDate, dateRange)) return false;
    return true;
  });

  return (
    <AppShell
      role="client"
      title="Projects"
      subtitle={`${myProjects.length} ${myProjects.length === 1 ? "project" : "projects"} with the ${client.name.split(" ")[0]} team`}
      actions={
        <div className="flex rounded-full border border-border bg-card p-0.5">
          <button onClick={() => setView("grid")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <ListIcon className="h-3.5 w-3.5" /> List
          </button>
        </div>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search projects…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
        dateRange={dateRange}
        onDateRange={setDateRange}
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const accentCls = {
              todo: { cardHover: "hover:border-rose-500/25", glow: "bg-rose-500/5 group-hover:bg-rose-500/10", badge: "bg-todo text-todo-foreground border-todo-foreground/20", bar: "bg-rose-500", textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400" },
              progress: { cardHover: "hover:border-amber-500/25", glow: "bg-amber-500/5 group-hover:bg-amber-500/10", badge: "bg-progress text-progress-foreground border-progress-foreground/20", bar: "bg-amber-500", textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400" },
              review: { cardHover: "hover:border-sky-500/25", glow: "bg-sky-500/5 group-hover:bg-sky-500/10", badge: "bg-review text-review-foreground border-review-foreground/20", bar: "bg-sky-500", textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400" },
              done: { cardHover: "hover:border-emerald-500/25", glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10", badge: "bg-done text-done-foreground border-done-foreground/20", bar: "bg-emerald-500", textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400" },
            }[p.accent] || { cardHover: "hover:border-primary/25", glow: "bg-primary/5 group-hover:bg-primary/10", badge: "bg-muted text-muted-foreground border-muted-foreground/20", bar: "bg-primary", textHover: "group-hover:text-primary" };

            return (
              <Link
                key={p.id}
                href={`/client/projects/${p.id}`}
                className={cn("group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}
              >
                <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold border transition-all duration-300", accentCls.badge)}>
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight truncate", accentCls.textHover)}>
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{client.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${PROJECT_STATUS_META[p.status].cls}`}>
                      {PROJECT_STATUS_META[p.status].label}
                    </span>
                    <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                      {{ fixed: "Fixed", hourly: "Hourly", retainer: "Retainer" }[p.type] ?? p.type}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                      <div className={cn("h-full rounded-full transition-all duration-500", accentCls.bar)} style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {p.type === "retainer" ? "End date" : "Due date"}: <span className="text-foreground font-semibold">{p.endDate}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <AvatarStack userIds={p.team} users={users} max={4} size={26} />
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              No projects match your filters.
            </div>
          )}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Team</th>
                <th className="px-5 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold border",
                        {
                          todo: "bg-todo text-todo-foreground border-todo-foreground/20",
                          progress: "bg-progress text-progress-foreground border-progress-foreground/20",
                          review: "bg-review text-review-foreground border-review-foreground/20",
                          done: "bg-done text-done-foreground border-done-foreground/20",
                        }[p.accent] || "bg-muted text-muted-foreground border-muted-foreground/20"
                      )}>
                        {p.name[0]}
                      </span>
                      <Link href={`/client/projects/${p.id}`} className="hover:text-primary transition-colors">{p.name}</Link>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>{PROJECT_STATUS_META[p.status].label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/60">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-500",
                          { todo: "bg-rose-500", progress: "bg-amber-500", review: "bg-sky-500", done: "bg-emerald-500" }[p.accent] || "bg-primary"
                        )} style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><AvatarStack userIds={p.team} users={users} max={3} size={22} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{p.endDate}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No projects match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

export default PortalProjects;
