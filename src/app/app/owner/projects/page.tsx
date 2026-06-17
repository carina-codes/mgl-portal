"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { PROJECT_STATUS_META } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { Plus, LayoutGrid, List as ListIcon, MoreHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";



function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(() => [
    { id: "status", label: "Status", multi: true, options: Object.entries(PROJECT_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })) },
    { id: "client", label: "Client", multi: true, options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })) },
    { id: "team", label: "Team", multi: true, options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })) },
    { id: "type", label: "Budget type", options: [{ value: "fixed", label: "Fixed bid" }, { value: "hourly", label: "Hourly" }] },
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const client = clients.find((c) => c.id === p.clientId)!;
            return (
              <div key={p.id} className="panel p-5 transition-transform hover:-translate-y-0.5">
                <Link href={`/app/projects/${p.id }`} className="block">
                  <div className={`h-24 w-full rounded-2xl bg-${p.accent}`} />
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                      {PROJECT_STATUS_META[p.status].label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{client?.name}</span>
                  </div>
                  <div className="mt-2 text-base font-semibold">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Due {p.endDate}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{p.progress}%</span>
                  </div>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack userIds={p.team} users={users} max={4} size={24} />
                  <div className="flex items-center gap-1">
                    <button onClick={() => open("project.status", { projectId: p.id })} className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">Status</button>
                    <button onClick={() => open("project.edit", { projectId: p.id })} className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">Edit</button>
                    <button onClick={() => open("project.archive", { projectId: p.id })} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-3.5 w-3.5" /></button>
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
                      <Link href={`/app/projects/${p.id }`} className="hover:text-primary">{p.name}</Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{client?.name}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => open("project.status", { projectId: p.id })} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>{PROJECT_STATUS_META[p.status].label}</button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><AvatarStack userIds={p.team} users={users} max={3} size={22} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{p.endDate}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => open("project.edit", { projectId: p.id })} className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted">Edit</button>
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

export default ProjectsPage;
