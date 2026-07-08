"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { totalHoursByUser } from "@/lib/mock-data";
import { UserPlus, Pencil, Trash2, LayoutGrid, List as ListIcon, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function TeamPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const allUsers = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const allTasks = useStore((s) => s.tasks);
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
          { value: "manager", label: "Manager" },
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
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button
            onClick={() => open("team.add")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Invite member
          </button>
        </>
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
      <div>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((u) => {
              const assignedProjects = projects.filter((p) => p.team.includes(u.id));
              const userTasks = allTasks.filter((t) => t.assignees.includes(u.id));
              const hours = totalHoursByUser(u.id);
              const isBusy = assignedProjects.length > 2;

              return (
                <div
                  key={u.id}
                  onClick={() => open("team.edit", { userId: u.id })}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-white dark:bg-card p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-white hover:border-primary/25 cursor-pointer"
                >
                  <div
                    className="absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none bg-primary/5 group-hover:bg-primary/10"
                    style={{ backgroundColor: `${u.color}10` }}
                  />

                  <div className="block space-y-4">
                    {/* Top row: Avatar + Name/Role */}
                    <div className="flex items-center gap-3">
                      <Link href={`/owner/team/${u.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 cursor-pointer group/header">
                        <UserAvatar user={u} size={44} />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold tracking-tight text-foreground truncate group-hover/header:text-primary transition-colors leading-tight">
                            {u.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                            {u.title}
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Display Flex: Status & Role tags (Left), Hourly Rate (Right) */}
                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          isBusy
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20"
                        )}>
                          {isBusy ? "Busy" : "Available"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60 capitalize">
                          {u.role}
                        </span>
                      </div>
                      <span className="text-foreground font-bold text-xs">
                        {u.hourlyRate ? `$${u.hourlyRate}/hr` : "—"}
                      </span>
                    </div>

                    {/* Email / Location Contact Row */}
                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <span className="truncate text-foreground font-semibold">{u.email}</span>
                      <span className="truncate">{u.city && u.state ? `${u.city}, ${u.state}` : ""}</span>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5 text-xs pt-1" onClick={(e) => e.stopPropagation()}>
                      <Stat label="Projects" value={assignedProjects.length.toString()} href={`/owner/team/${u.id}`} />
                      <Stat label="Tasks" value={userTasks.length.toString()} href={`/owner/team/${u.id}`} />
                      <Stat label="Time" value={`${hours.toFixed(1)}h`} href={`/owner/time?member=${u.id}`} />
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
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Availability</th>
                    <th className="px-5 py-3 font-medium">Active Projects</th>
                    <th className="px-5 py-3 font-medium">Hours (6d)</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const assignedProjects = projects.filter((p) => p.team.includes(u.id));
                    const hours = totalHoursByUser(u.id);
                    const isBusy = assignedProjects.length > 2;

                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={u} size={28} />
                            <div className="flex flex-col">
                              <Link href={`/owner/team/${u.id}`} className="text-foreground font-bold hover:text-primary transition-colors cursor-pointer">
                                {u.name}
                              </Link>
                              <span className="text-[11px] text-muted-foreground mt-0.5">{u.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-5 py-3 capitalize text-muted-foreground">
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isBusy
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20"
                          )}>
                            {isBusy ? "Busy" : "Available"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{assignedProjects.length}</td>
                        <td className="px-5 py-3 text-muted-foreground">{hours.toFixed(1)}h</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => open("team.edit", { userId: u.id })}
                              className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => open("team.remove", { userId: u.id })}
                              className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/5 cursor-pointer transition-all"
                            >
                              Remove
                            </button>
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

export default TeamPage;
