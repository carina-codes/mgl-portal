"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { PROJECT_STATUS_META } from "@/lib/mock-data";
import { useStore, useProjects } from "@/lib/store";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { Plus, LayoutGrid, List as ListIcon, MoreHorizontal, Archive, Trash2, UserPlus } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";



function ProjectsView() {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const projects = useProjects();
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const memberParam = searchParams.get("member");

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    if (clientParam) {
      initial.client = [clientParam];
    }
    if (memberParam) {
      initial.team = [memberParam];
    }
    return initial;
  });

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      if (clientParam) next.client = [clientParam];
      if (memberParam) next.team = [memberParam];
      return next;
    });
  }, [clientParam, memberParam]);

  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(() => [
    { id: "client", label: "Client", multi: true, options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })) },
    { id: "status", label: "Status", multi: true, options: Object.entries(PROJECT_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })) },
    { id: "team", label: "Team", multi: true, options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })) },
    { id: "type", label: "Type", options: [{ value: "fixed", label: "Fixed bid" }, { value: "hourly", label: "Hourly" }, { value: "retainer", label: "Retainer" }] },
  ], [clients, users]);

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(p.status)) return false;
    if (filters.client?.length && !filters.client.includes(p.clientId)) return false;
    if (filters.team?.length && !p.team.some((t) => filters.team!.includes(t))) return false;
    if (filters.type?.length && !filters.type.includes(p.type)) return false;
    if (!inRange(p.startDate, dateRange)) return false;
    return true;
  });

  return (
    <AppShell
      title="Projects"
      subtitle={`${projects.length} projects across ${new Set(projects.map((p) => p.clientId)).size} clients`}
      actions={
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button onClick={() => setView("grid")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button onClick={() => open("project.new")} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New project
          </button>
        </>
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
            const client = clients.find((c) => c.id === p.clientId)!;
            const accentCls = {
              todo: {
                cardHover: "hover:border-rose-500/25",
                glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
                badge: "bg-todo text-todo-foreground border-todo-foreground/20",
                bar: "bg-rose-500",
                textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
              },
              progress: {
                cardHover: "hover:border-amber-500/25",
                glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
                badge: "bg-progress text-progress-foreground border-progress-foreground/20",
                bar: "bg-amber-500",
                textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
              },
              review: {
                cardHover: "hover:border-sky-500/25",
                glow: "bg-sky-500/5 group-hover:bg-sky-500/10",
                badge: "bg-review text-review-foreground border-review-foreground/20",
                bar: "bg-sky-500",
                textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
              },
              done: {
                cardHover: "hover:border-emerald-500/25",
                glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
                badge: "bg-done text-done-foreground border-done-foreground/20",
                bar: "bg-emerald-500",
                textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
              },
            }[p.accent] || {
              cardHover: "hover:border-primary/25",
              glow: "bg-primary/5 group-hover:bg-primary/10",
              badge: "bg-muted text-muted-foreground border-muted-foreground/20",
              bar: "bg-primary",
              textHover: "group-hover:text-primary",
            };

            return (
              <div key={p.id} className={cn("group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}>
                <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />
                
                <Link href={`/owner/projects/${p.id}`} className="block space-y-4">
                  {/* Top Header Row: Project Accent Square + Text Details */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold border transition-all duration-300",
                      accentCls.badge
                    )}>
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight truncate", accentCls.textHover)}>
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{client?.name}</p>
                    </div>
                  </div>

                  {/* Status & Billing Type Row */}
                  <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${PROJECT_STATUS_META[p.status].cls}`}>
                      {PROJECT_STATUS_META[p.status].label}
                    </span>
                    <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                      {{
                        fixed: "Fixed",
                        hourly: "Hourly",
                        retainer: "Retainer",
                      }[p.type] ?? p.type}
                    </span>
                  </div>

                  {/* Progress & Target Launch */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          accentCls.bar
                        )}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {p.type === "retainer" ? "End date" : "Due date"}: <span className="text-foreground font-semibold">{p.endDate}</span>
                    </p>
                  </div>
                </Link>

                {/* Footer Section: Team & Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <AvatarStack userIds={p.team} users={users} max={4} size={26} />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => open("project.edit", { projectId: p.id })}
                      className="rounded-full border border-border/50 bg-background/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="rounded-full border border-border/50 bg-background/30 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border border-border bg-card">
                        <DropdownMenuItem
                          onClick={() => router.push(`/owner/projects/${p.id}?tab=files`)}
                          className="flex items-center gap-2 cursor-pointer font-normal"
                        >
                          <span>View files</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => open("project.delete", { projectId: p.id })}
                          className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer font-normal"
                        >
                          <span>Delete project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
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
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Team</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clients.find((c) => c.id === p.clientId)!;
                return (
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
                        <Link href={`/owner/projects/${p.id}`} className="hover:text-primary transition-colors">{p.name}</Link>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{client?.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>{PROJECT_STATUS_META[p.status].label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/60">
                          <div className={cn(
                            "h-full rounded-full transition-all duration-500",
                            {
                              todo: "bg-rose-500",
                              progress: "bg-amber-500",
                              review: "bg-sky-500",
                              done: "bg-emerald-500",
                            }[p.accent] || "bg-primary"
                          )} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><AvatarStack userIds={p.team} users={users} max={3} size={22} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{p.endDate}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => open("project.edit", { projectId: p.id })} className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all">Edit</button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-full p-1 text-muted-foreground hover:bg-muted cursor-pointer transition-all">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border border-border bg-card">
                            <DropdownMenuItem
                              onClick={() => router.push(`/owner/projects/${p.id}?tab=files`)}
                              className="flex items-center gap-2 cursor-pointer font-normal"
                            >
                              <span>View files</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => open("project.delete", { projectId: p.id })}
                              className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer font-normal"
                            >
                              <span>Delete project</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsView />
    </Suspense>
  );
}

export default ProjectsPage;
