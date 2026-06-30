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
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  FileDown,
  TrendingUp,
  Percent,
  PiggyBank,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ReportingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleRefresh = () => {
    toast.success("Reporting data refreshed");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!mounted) return null;

  return (
    <AppShell
      title="Reporting"
      subtitle="Profitability, capacity and budget health"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" /> Refresh
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4" /> Export to PDF
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
        trailing={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="h-3 w-3 accent-primary cursor-pointer"
            />
            Compare to previous period
          </label>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Kpi
          label="Revenue (MTD)"
          value="$84,200"
          delta="+18% vs last"
          trend="up"
          icon={PiggyBank}
          colorCls="text-blue-500 bg-blue-500/10 border-blue-500/10"
        />
        <Kpi
          label="Avg. Utilization"
          value="74%"
          delta="+4 pts"
          trend="up"
          icon={Percent}
          colorCls="text-emerald-500 bg-emerald-500/10 border-emerald-500/10"
        />
        <Kpi
          label="Avg. Project Margin"
          value="38%"
          delta="-2 pts"
          trend="down"
          icon={TrendingUp}
          colorCls="text-rose-500 bg-rose-500/10 border-rose-500/10"
        />
        <Kpi
          label="On-Time Delivery"
          value="92%"
          delta="Steady"
          trend="up"
          icon={Sparkles}
          colorCls="text-amber-500 bg-amber-500/10 border-amber-500/10"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hours by Client */}
        <div className="panel p-6 bg-card border-border/60">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Hours by Client</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {compare ? "Current vs previous period Comparison" : "Selected reporting period"}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byClient} margin={{ left: -15, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.15}/>
                </linearGradient>
                <linearGradient id="colorPrevHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {compare && (
                <Bar name="Previous Hours" dataKey="previous" fill="url(#colorPrevHours)" radius={[6, 6, 0, 0]} barSize={24} />
              )}
              <Bar name="Current Hours" dataKey="hours" fill="url(#colorHours)" radius={[6, 6, 0, 0]} barSize={compare ? 16 : 28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Studio Capacity Area Chart */}
        <div className="panel p-6 bg-card border-border/60">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Studio Capacity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Hours logged per week</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ left: -15, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {compare && (
                <Line
                  type="monotone"
                  name="Previous Hours"
                  dataKey="previous"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
              <Area type="monotone" name="Current Hours" dataKey="current" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 3, stroke: "#6366F1", strokeWidth: 1.5, fill: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hours by Team Member */}
        <div className="panel p-6 bg-card border-border/60">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Hours by Team Member</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Logged hours breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byMember} layout="vertical" margin={{ left: -10, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar name="Hours Logged" dataKey="hours" radius={[0, 6, 6, 0]} barSize={16}>
                {byMember.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#4F46E5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Profitability Table */}
        <div className="panel p-6 bg-card border-border/60">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Project Profitability</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Budget spend & margin indicators</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="py-2.5 font-semibold">Project</th>
                  <th className="py-2.5 font-semibold">Budget vs Spent</th>
                  <th className="py-2.5 font-semibold text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {projectsScoped.slice(0, 8).map((p) => {
                  const margin = Math.round(((p.budget - p.spent) / Math.max(1, p.budget)) * 100);
                  const percentSpent = Math.min(100, Math.round((p.spent / Math.max(1, p.budget)) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                      {/* Name */}
                      <td className="py-3 font-semibold text-foreground text-xs pr-4">
                        {p.name}
                      </td>

                      {/* Budget comparison progress meter */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold mb-1">
                          <span>${(p.spent / 1000).toFixed(0)}k spent</span>
                          <span>${(p.budget / 1000).toFixed(0)}k budget</span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percentSpent > 90 ? "bg-rose-500" : percentSpent > 70 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${percentSpent}%` }}
                          />
                        </div>
                      </td>

                      {/* Margin badge */}
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            margin > 30
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10"
                              : margin > 10
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10"
                          )}
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

/* ---------- Custom Recharts Tooltip Atom ---------- */

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/90 backdrop-blur-md p-3 shadow-lg text-xs leading-none space-y-1.5 select-none text-foreground border-border">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="flex items-center gap-2 font-medium" style={{ color: p.color || p.fill }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span>{p.name}:</span>
            <span className="font-bold font-mono ml-auto">{p.value}h</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/* ---------- KPI Grid Component with sparklines ---------- */

function Kpi({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  colorCls,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ComponentType<any>;
  colorCls: string;
}) {
  // Generate a mini sparkline data array deterministically
  const sparklineData = useMemo(() => {
    const seed = label.charCodeAt(0) || 0;
    return Array.from({ length: 6 }).map((_, i) => ({
      val: Math.round(30 + ((i * 12 + seed) % 40)),
    }));
  }, [label]);

  return (
    <div className="panel p-5 bg-card/60 border-border/60 hover:scale-[1.01] hover:bg-card/80 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden select-none">
      {/* Glow asset */}
      <div
        className="absolute right-0 top-0 -mt-6 -mr-6 h-16 w-16 rounded-full blur-lg opacity-10 pointer-events-none group-hover:scale-125 transition-transform"
        style={{
          backgroundColor: trend === "up" ? "#10B981" : "#EF4444",
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">{label}</span>
          <span className="mt-1 text-2xl font-bold text-foreground leading-none block">{value}</span>
        </div>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl border shrink-0", colorCls)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-2 py-0.5 border leading-none",
          trend === "up"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10"
        )}>
          {trend === "up" ? <ArrowUpRight className="h-3 w-3 shrink-0" /> : <ArrowDownRight className="h-3 w-3 shrink-0" />}
          <span>{delta}</span>
        </div>

        {/* Sparkline line-chart */}
        <div className="h-6 w-16 opacity-75 group-hover:opacity-100 transition-opacity pr-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="val"
                stroke={trend === "up" ? "#10B981" : "#EF4444"}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default ReportingPage;
