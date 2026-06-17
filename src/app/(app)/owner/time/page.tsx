"use client";


import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { Plus, Pencil } from "lucide-react";
import { useState, useMemo } from "react";



function TimePage() {
  const allEntries = useStore((s) => s.timeEntries);
  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(
    () => [
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
        ],
      },
    ],
    [users, projects, clients],
  );

  const filtered = allEntries.filter((e) => {
    const project = projects.find((p) => p.id === e.projectId);
    if (search && !e.note?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.member?.length && !filters.member.includes(e.userId)) return false;
    if (filters.project?.length && !filters.project.includes(e.projectId)) return false;
    if (filters.client?.length && (!project || !filters.client.includes(project.clientId))) return false;
    if (filters.billable?.length) {
      const v = filters.billable[0];
      if (v === "yes" && !e.billable) return false;
      if (v === "no" && e.billable) return false;
    }
    if (!inRange(e.date, dateRange)) return false;
    return true;
  });

  const total = filtered.reduce((s, t) => s + t.hours, 0);
  const billable = filtered.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);

  return (
    <AppShell
      title="Time tracking"
      subtitle="Hours across the studio"
      actions={
        <button
          onClick={() => open("time.log")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Log time
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Logged this view</div>
          <div className="mt-1 text-3xl font-semibold">{total.toFixed(0)}h</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Billable</div>
          <div className="mt-1 text-3xl font-semibold">{billable.toFixed(0)}h</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs text-muted-foreground">Utilization</div>
          <div className="mt-1 text-3xl font-semibold">{total ? Math.round((billable / total) * 100) : 0}%</div>
        </div>
      </div>

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
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Billable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 80).map((e) => {
              const u = users.find((x) => x.id === e.userId);
              const p = projects.find((p) => p.id === e.projectId);
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u && <UserAvatar user={u} size={20} />} {u?.name.split(" ")[0]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.note}</td>
                  <td className="px-4 py-3 font-medium">{e.hours}h</td>
                  <td className="px-4 py-3">
                    {e.billable ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Billable</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => open("time.edit", { entryId: e.id })}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No time entries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default TimePage;
