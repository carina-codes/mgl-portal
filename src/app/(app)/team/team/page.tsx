"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore, isProjectMember, totalHoursByUser } from "@/lib/store";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { LayoutGrid, List as ListIcon, MoreHorizontal, Plus, ShieldAlert } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type TeamSortField = "name" | "email" | "role" | "status" | "projects" | "time";

function TeamRosterPage() {
  const { isManager } = useActiveTeamMember();
  const [view, setView] = useState<"grid" | "list">("grid");
  const allUsers = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const allTasks = useStore((s) => s.tasks);
  const timeEntries = useStore((s) => s.timeEntries);
  const updateTeamMember = useStore((s) => s.updateTeamMember);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<TeamSortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: TeamSortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const team = allUsers.filter((u) => u.role !== "client");

  const filterDefs = useMemo(
    () => [
      {
        id: "availability",
        label: "Status",
        options: [
          { value: "available", label: "Available", color: "#10B981" },
          { value: "busy", label: "Busy", color: "#F59E0B" },
        ],
      },
      {
        id: "role",
        label: "Role",
        multi: true,
        options: [
          { value: "owner", label: "Owner" },
          { value: "manager", label: "Manager" },
          { value: "team", label: "Team" },
        ],
      },
      {
        id: "active",
        label: "Project",
        multi: true,
        options: projects.map((p) => ({ value: p.id, label: p.name })),
      },
    ],
    [projects],
  );

  const filtered = useMemo(() => {
    const result = team.filter((u) => {
      const assignedProjects = projects.filter((p) => isProjectMember(p, allTasks, u.id));
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filters.role?.length && !filters.role.includes(u.role)) return false;
      if (filters.active?.length && !assignedProjects.some((p) => filters.active!.includes(p.id))) return false;
      if (filters.availability?.length) {
        const currentStatus = u.status || (assignedProjects.length > 2 ? "Busy" : "Available");
        const isBusy = currentStatus === "Busy";
        if (filters.availability[0] === "available" && isBusy) return false;
        if (filters.availability[0] === "busy" && !isBusy) return false;
      }
      return true;
    });

    return [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === "email") {
        valA = a.email;
        valB = b.email;
      } else if (sortBy === "role") {
        valA = a.role;
        valB = b.role;
      } else if (sortBy === "status") {
        const aBusy = a.status || (projects.filter((p) => isProjectMember(p, allTasks, a.id)).length > 2 ? "Busy" : "Available");
        const bBusy = b.status || (projects.filter((p) => isProjectMember(p, allTasks, b.id)).length > 2 ? "Busy" : "Available");
        valA = aBusy;
        valB = bBusy;
      } else if (sortBy === "projects") {
        valA = projects.filter((p) => isProjectMember(p, allTasks, a.id)).length;
        valB = projects.filter((p) => isProjectMember(p, allTasks, b.id)).length;
      } else if (sortBy === "time") {
        valA = totalHoursByUser(timeEntries, a.id);
        valB = totalHoursByUser(timeEntries, b.id);
      } else {
        valA = a.name;
        valB = b.name;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [team, projects, allTasks, timeEntries, search, filters, sortBy, sortOrder]);

  if (!isManager) {
    return (
      <AppShell role="team" title="Team">
        <div className="panel grid place-items-center gap-3 p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Manager access required</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              The team directory is only available to team members with the manager role.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="team"
      title="Team"
      subtitle={`${team.length} members across the workspace`}
      actions={
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button
            onClick={() => open("team.add")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add member
          </button>
        </>
      }
    >
      <FilterBar search={search} onSearch={setSearch} placeholder="Search team…" filters={filterDefs} values={filters} onChange={setFilters} />

      <div className="mt-4">
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((u) => {
              const assignedProjects = projects.filter((p) => isProjectMember(p, allTasks, u.id));
              const userTasks = allTasks.filter((t) => t.assignees.includes(u.id));
              const hours = totalHoursByUser(timeEntries, u.id);
              const currentStatus = u.status || (assignedProjects.length > 2 ? "Busy" : "Available");
              const isBusy = currentStatus === "Busy";

              return (
                <div
                  key={u.id}
                  onClick={() => open("team.edit", { userId: u.id })}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-white dark:bg-card p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-white hover:border-primary/25 cursor-pointer"
                >
                  <div className="absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none bg-primary/5 group-hover:bg-primary/10" style={{ backgroundColor: `${u.color}10` }} />

                  <div className="block space-y-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} size={44} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold tracking-tight text-foreground truncate group-hover/header:text-primary transition-colors leading-tight">{u.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{u.title}</p>
                      </div>
                    </div>

                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          isBusy ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20"
                        )}>
                          {isBusy ? "Busy" : "Available"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60 capitalize">{u.role}</span>
                      </div>
                    </div>

                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <span className="truncate text-foreground font-semibold">{u.email}</span>
                      <span className="truncate">{u.city && u.state ? `${u.city}, ${u.state}` : ""}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-xs pt-1" onClick={(e) => e.stopPropagation()}>
                      <Stat label="Projects" value={assignedProjects.length.toString()} href={`/team/projects?member=${u.id}`} />
                      <Stat label="Tasks" value={userTasks.length.toString()} href={`/team/tasks?member=${u.id}`} />
                      <Stat label="Time" value={`${parseFloat(hours.toFixed(2))}h`} href={`/team/time?member=${u.id}`} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                    <div className="flex -space-x-1">
                      {assignedProjects.slice(0, 3).map((p, pIdx) => (
                        <div
                          key={p.id}
                          className="inline-flex items-center justify-center rounded-full font-bold text-white ring-2 ring-card text-[9px] uppercase tracking-wider"
                          style={{ width: "24px", height: "24px", backgroundColor: ["#0049FE", "#1E62FF", "#0036C1"][pIdx % 3] }}
                          title={p.name}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {assignedProjects.length > 3 && (
                        <div className="inline-flex items-center justify-center rounded-full font-bold bg-muted text-muted-foreground ring-2 ring-card text-[9px]" style={{ width: "24px", height: "24px" }}>
                          +{assignedProjects.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => open("team.edit", { userId: u.id })} className="rounded-2xl border border-border/50 bg-background/30 px-3.5 py-1 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/20 transition-all cursor-pointer">
                        Edit
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-full border border-border/50 bg-background/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border border-border bg-card">
                          <DropdownMenuItem
                            onClick={() => {
                              if (isBusy) {
                                updateTeamMember(u.id, { status: "Available" });
                                toast.success(`${u.name} is now set to available`);
                              } else {
                                updateTeamMember(u.id, { status: "Busy" });
                                toast.success(`${u.name} is now set to busy`);
                              }
                            }}
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            <span>{isBusy ? "Set to available" : "Set to busy"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await useStore.getState().resendTeamInvite(u.id);
                                toast.success(`Invite email resent to ${u.email}`);
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Failed to resend invite");
                              }
                            }}
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            <span>Resend invite email</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => open("team.remove", { userId: u.id })}
                            className="flex items-center gap-2 cursor-pointer font-normal text-rose-500 hover:text-rose-600 focus:text-rose-500"
                          >
                            <span>Delete member</span>
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
                No team members match your filters.
              </div>
            )}
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th onClick={() => handleSort("name")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Member {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("email")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("role")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Role {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("status")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("projects")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Active Projects {sortBy === "projects" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("time")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                      Time {sortBy === "time" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const assignedProjects = projects.filter((p) => isProjectMember(p, allTasks, u.id));
                    const hours = totalHoursByUser(timeEntries, u.id);
                    const currentStatus = u.status || (assignedProjects.length > 2 ? "Busy" : "Available");
                    const isBusy = currentStatus === "Busy";

                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={u} size={28} />
                            <div className="flex flex-col text-left">
                              <button onClick={() => open("team.edit", { userId: u.id })} className="text-foreground font-bold hover:text-primary transition-colors cursor-pointer text-left">
                                {u.name}
                              </button>
                              <span className="text-[11px] text-muted-foreground mt-0.5">{u.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-5 py-3 capitalize text-muted-foreground">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">{u.role}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isBusy ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20"
                          )}>
                            {isBusy ? "Busy" : "Available"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <Link href={`/team/projects?member=${u.id}`} className="hover:text-primary transition-colors font-medium">{assignedProjects.length}</Link>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground font-medium">
                          <Link href={`/team/time?member=${u.id}`} className="hover:text-primary transition-colors font-medium">{parseFloat(hours.toFixed(2))}h</Link>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => open("team.edit", { userId: u.id })} className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all">
                              Edit
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="rounded-full p-1 text-muted-foreground hover:bg-muted cursor-pointer transition-all">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 border border-border bg-card">
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (isBusy) {
                                      updateTeamMember(u.id, { status: "Available" });
                                      toast.success(`${u.name} is now set to available`);
                                    } else {
                                      updateTeamMember(u.id, { status: "Busy" });
                                      toast.success(`${u.name} is now set to busy`);
                                    }
                                  }}
                                  className="flex items-center gap-2 cursor-pointer font-normal"
                                >
                                  <span>{isBusy ? "Set to available" : "Set to busy"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await useStore.getState().resendTeamInvite(u.id);
                                      toast.success(`Invite email resent to ${u.email}`);
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : "Failed to resend invite");
                                    }
                                  }}
                                  className="flex items-center gap-2 cursor-pointer font-normal"
                                >
                                  <span>Resend invite email</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => open("team.remove", { userId: u.id })}
                                  className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer font-normal"
                                >
                                  <span>Delete member</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground bg-transparent">
                        No team members match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="group flex w-full flex-col items-center justify-center rounded-xl bg-background/40 border border-border/40 py-1.5 px-2 hover:bg-background/80 hover:border-primary/30 transition-all hover:-translate-y-0.5 duration-300 cursor-pointer">
      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-none">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href} className="w-full flex">{content}</Link>;
  }

  return content;
}

export default TeamRosterPage;
