"use client";


import { AppShell } from "@/components/app-shell";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useState, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";



function ReportingPage() {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const timeEntries = useStore((s) => s.timeEntries);
  const users = useStore((s) => s.users);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [compare, setCompare] = useState(true);

  const filterDefs = useMemo(
    () => [
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
        label: "Member",
        multi: true,
        options: users.filter((u) => u.role !== "client").map((u) => ({ value: u.id, label: u.name, color: u.color })),
      },
    ],
    [clients, projects, users],
  );

  const entriesScoped = timeEntries.filter((e) => {
    const project = projects.find((p) => p.id === e.projectId);
    if (filters.client?.length && (!project || !filters.client.includes(project.clientId))) return false;
    if (filters.project?.length && !filters.project.includes(e.projectId)) return false;
    if (filters.member?.length && !filters.member.includes(e.userId)) return false;
    if (!inRange(e.date, dateRange)) return false;
    return true;
  });

  const projectsScoped = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.client?.length && !filters.client.includes(p.clientId)) return false;
    if (filters.project?.length && !filters.project.includes(p.id)) return false;
    return true;
  });

  const byClient = clients
    .filter((c) => !filters.client?.length || filters.client.includes(c.id))
    .map((c) => {
      const cprojects = projects.filter((p) => p.clientId === c.id);
      const hours = entriesScoped
        .filter((t) => cprojects.some((p) => p.id === t.projectId))
        .reduce((s, t) => s + t.hours, 0);
      // Use deterministic calculation based on client ID hash to avoid hydration mismatch
      const hash = c.id.charCodeAt(c.id.length - 1) || 0;
      const prev = Math.max(1, hours * (0.7 + (hash % 5) * 0.1));
      return {
        name: c.name.split(" ")[0],
        hours: Math.round(hours),
        previous: Math.round(prev),
      };
    });

  const byMember = users
    .filter((u) => u.role !== "client")
    .filter((u) => !filters.member?.length || filters.member.includes(u.id))
    .map((u) => {
      const hours = entriesScoped.filter((t) => t.userId === u.id).reduce((s, t) => s + t.hours, 0);
      return { name: u.name.split(" ")[0], hours: Math.round(hours), color: u.color };
    });

  const trend = Array.from({ length: 12 }).map((_, i) => ({
    week: `W${i + 1}`,
    current: Math.round(120 + ((i * 17) % 80)),
    previous: Math.round(110 + ((i * 23) % 70)),
  }));

  return (
    <AppShell title="Reporting" subtitle="Profitability, capacity and budget health">
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search projects…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
        dateRange={dateRange}
        onDateRange={setDateRange}
        trailing={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="h-3 w-3 accent-primary"
            />
            Compare to previous period
          </label>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Revenue (MTD)" value="$84.2k" delta="+18% vs last" trend="up" />
        <Kpi label="Avg. utilization" value="74%" delta="+4 pts" trend="up" />
        <Kpi label="Avg. project margin" value="38%" delta="-2 pts" trend="down" />
        <Kpi label="On-time delivery" value="92%" delta="Steady" trend="up" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="mb-1 text-lg font-semibold">Hours by client</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {compare ? "Current vs previous period" : "Selected period"}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byClient}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {compare && (
                <Bar dataKey="previous" fill="oklch(0.88 0.04 263)" radius={[8, 8, 0, 0]} />
              )}
              <Bar dataKey="hours" fill="oklch(0.52 0.27 263)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-6">
          <h3 className="mb-1 text-lg font-semibold">Studio capacity</h3>
          <p className="mb-4 text-xs text-muted-foreground">Hours logged per week</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid stroke="oklch(0.93 0 0)" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {compare && (
                <Line type="monotone" dataKey="previous" stroke="oklch(0.78 0.05 263)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              )}
              <Line type="monotone" dataKey="current" stroke="oklch(0.52 0.27 263)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="mb-1 text-lg font-semibold">Hours by team member</h3>
          <p className="mb-4 text-xs text-muted-foreground">Selected period</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byMember} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="hours" fill="oklch(0.52 0.27 263)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-6">
          <h3 className="mb-3 text-lg font-semibold">Project profitability</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 font-medium">Project</th>
                  <th className="py-3 font-medium">Budget</th>
                  <th className="py-3 font-medium">Spent</th>
                  <th className="py-3 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {projectsScoped.slice(0, 8).map((p) => {
                  const margin = Math.round(((p.budget - p.spent) / Math.max(1, p.budget)) * 100);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-muted-foreground">${(p.budget / 1000).toFixed(0)}k</td>
                      <td className="py-3 text-muted-foreground">${(p.spent / 1000).toFixed(0)}k</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${margin > 30 ? "bg-emerald-100 text-emerald-700" : margin > 10 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: "up" | "down" }) {
  return (
    <div className="panel p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-[11px] ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}
      >
        {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {delta}
      </div>
    </div>
  );
}

export default ReportingPage;
