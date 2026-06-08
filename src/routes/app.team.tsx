import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { currentTeam, totalHoursByUser, projects } from "@/lib/mock-data";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/app/team")({ component: TeamPage });

function TeamPage() {
  return (
    <AppShell
      title="Team"
      subtitle={`${currentTeam.length} members across the studio`}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-4 w-4" /> Invite member
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentTeam.map((u) => {
          const assignedProjects = projects.filter((p) => p.team.includes(u.id));
          const hours = totalHoursByUser(u.id);
          return (
            <div key={u.id} className="panel p-5">
              <div className="flex items-center gap-3">
                <UserAvatar user={u} size={48} />
                <div className="flex-1">
                  <div className="text-base font-semibold">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.title}</div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">{u.role}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-muted px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Projects</div>
                  <div className="text-sm font-semibold">{assignedProjects.length}</div>
                </div>
                <div className="rounded-xl bg-muted px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours (6d)</div>
                  <div className="text-sm font-semibold">{hours.toFixed(1)}h</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
