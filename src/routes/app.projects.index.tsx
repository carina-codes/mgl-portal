import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { projects, clients, users, PROJECT_STATUS_META } from "@/lib/mock-data";
import { Plus, LayoutGrid, List as ListIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  return (
    <AppShell
      title="Projects"
      subtitle={`${projects.length} projects across ${new Set(projects.map((p) => p.clientId)).size} clients`}
      actions={
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New project
          </button>
        </>
      }
    >
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const client = clients.find((c) => c.id === p.clientId)!;
            return (
              <Link
                key={p.id}
                to="/app/projects/$projectId"
                params={{ projectId: p.id }}
                className="panel p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className={`h-24 w-full rounded-2xl bg-${p.accent}`} />
                <div className="mt-4 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                    {PROJECT_STATUS_META[p.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{client.name}</span>
                </div>
                <div className="mt-2 text-base font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">Due {p.endDate}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{p.progress}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack userIds={p.team} users={users} max={4} size={24} />
                  <div className="text-[11px] text-muted-foreground">
                    {p.hoursLogged}/{p.hoursEstimate}h
                  </div>
                </div>
              </Link>
            );
          })}
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
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const client = clients.find((c) => c.id === p.clientId)!;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">
                      <Link to="/app/projects/$projectId" params={{ projectId: p.id }} className="hover:text-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{client.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                        {PROJECT_STATUS_META[p.status].label}
                      </span>
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
