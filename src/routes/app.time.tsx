import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { timeEntries, users, projects } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/time")({ component: TimePage });

function TimePage() {
  const entries = timeEntries.slice(0, 40);
  const total = entries.reduce((s, t) => s + t.hours, 0);
  const billable = entries.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);
  return (
    <AppShell title="Time tracking" subtitle="Hours across the studio">
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
          <div className="mt-1 text-3xl font-semibold">{Math.round((billable / total) * 100)}%</div>
        </div>
      </div>

      <div className="panel p-2">
        <div className="flex items-center justify-between p-3">
          <h3 className="text-sm font-semibold">Recent entries</h3>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus className="h-3 w-3" /> Log time
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Member</th>
              <th className="px-3 py-3 font-medium">Project</th>
              <th className="px-3 py-3 font-medium">Note</th>
              <th className="px-3 py-3 font-medium">Hours</th>
              <th className="px-3 py-3 font-medium">Billable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const u = users.find((x) => x.id === e.userId)!;
              const p = projects.find((p) => p.id === e.projectId)!;
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><UserAvatar user={u} size={20} /> {u.name.split(" ")[0]}</div></td>
                  <td className="px-3 py-3 text-muted-foreground">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{e.note}</td>
                  <td className="px-3 py-3 font-medium">{e.hours}h</td>
                  <td className="px-3 py-3">{e.billable ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Billable</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
