import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { clients, projects, timeEntries } from "@/lib/mock-data";
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

export const Route = createFileRoute("/app/reporting")({ component: ReportingPage });

function ReportingPage() {
  const byClient = clients.map((c) => {
    const cprojects = projects.filter((p) => p.clientId === c.id);
    const hours = timeEntries
      .filter((t) => cprojects.some((p) => p.id === t.projectId))
      .reduce((s, t) => s + t.hours, 0);
    return { name: c.name.split(" ")[0], hours: Math.round(hours), budget: cprojects.reduce((s, p) => s + p.budget, 0) / 1000 };
  });

  const trend = Array.from({ length: 12 }).map((_, i) => ({
    week: `W${i + 1}`,
    hours: Math.round(120 + Math.random() * 80),
  }));

  return (
    <AppShell title="Reporting" subtitle="Profitability, capacity and budget health">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Revenue (MTD)" value="$84.2k" delta="+18% vs last" />
        <Kpi label="Avg. utilization" value="74%" delta="+4 pts" />
        <Kpi label="Avg. project margin" value="38%" delta="-2 pts" />
        <Kpi label="On-time delivery" value="92%" delta="Steady" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="mb-1 text-lg font-semibold">Hours by client</h3>
          <p className="mb-4 text-xs text-muted-foreground">Last 30 days</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byClient}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
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
              <Line type="monotone" dataKey="hours" stroke="oklch(0.52 0.27 263)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 panel p-6">
        <h3 className="mb-3 text-lg font-semibold">Project profitability</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-3 font-medium">Project</th>
              <th className="py-3 font-medium">Budget</th>
              <th className="py-3 font-medium">Spent</th>
              <th className="py-3 font-medium">Hours est/actual</th>
              <th className="py-3 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const margin = Math.round(((p.budget - p.spent) / p.budget) * 100);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3 text-muted-foreground">${(p.budget / 1000).toFixed(0)}k</td>
                  <td className="py-3 text-muted-foreground">${(p.spent / 1000).toFixed(0)}k</td>
                  <td className="py-3 text-muted-foreground">{p.hoursEstimate}h / {p.hoursLogged}h</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${margin > 30 ? "bg-emerald-100 text-emerald-700" : margin > 10 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {margin}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="panel p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    </div>
  );
}
