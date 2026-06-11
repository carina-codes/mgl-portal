import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { totalHoursByUser } from "@/lib/mock-data";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/app/team")({ component: TeamPage });

function TeamPage() {
  const allUsers = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const team = allUsers.filter((u) => u.role !== "client");

  const filterDefs = useMemo(
    () => [
      {
        id: "role",
        label: "Role",
        multi: true,
        options: [
          { value: "owner", label: "Owner" },
          { value: "team", label: "Team" },
        ],
      },
      {
        id: "availability",
        label: "Availability",
        options: [
          { value: "available", label: "Available", color: "#10B981" },
          { value: "busy", label: "Busy", color: "#F59E0B" },
        ],
      },
      {
        id: "active",
        label: "Active project",
        multi: true,
        options: projects.map((p) => ({ value: p.id, label: p.name })),
      },
    ],
    [projects],
  );

  const filtered = team.filter((u) => {
    const assignedProjects = projects.filter((p) => p.team.includes(u.id));
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filters.role?.length && !filters.role.includes(u.role)) return false;
    if (filters.active?.length && !assignedProjects.some((p) => filters.active!.includes(p.id))) return false;
    if (filters.availability?.length) {
      const isBusy = assignedProjects.length > 2;
      if (filters.availability[0] === "available" && isBusy) return false;
      if (filters.availability[0] === "busy" && !isBusy) return false;
    }
    return true;
  });

  return (
    <AppShell
      title="Team"
      subtitle={`${team.length} members across the studio`}
      actions={
        <button
          onClick={() => open("team.add")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Invite member
        </button>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search team…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => {
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
              <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  onClick={() => open("team.edit", { userId: u.id })}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => open("team.remove", { userId: u.id })}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
            No team members match your filters.
          </div>
        )}
      </div>
    </AppShell>
  );
}
