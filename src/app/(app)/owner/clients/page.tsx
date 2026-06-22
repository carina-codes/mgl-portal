"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import {
  Plus,
  Pencil,
  Archive,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  List as ListIcon,
  Globe,
  Phone,
  Mail,
  ArrowUpDown,
  Settings,
  Share2,
  UserPlus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AvatarStack } from "@/components/user-avatar";

const HEALTH_TONE: Record<string, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" },
  watch: { label: "Watch", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20" },
  "at-risk": { label: "At Risk", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20" },
};

const STATUS_TONE: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20" },
  paused: { label: "Paused", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20" },
  archived: { label: "Archived", cls: "bg-muted text-muted-foreground border border-border/60" },
};

type SortKey = "name" | "projects" | "requests" | "hours" | "lastActivity" | "since";

const getClientUserIds = (c: any, projects: any[], users: any[]) => {
  const ids = new Set<string>();
  
  const primaryUser = users.find((u) => u.email === c.contactEmail);
  if (primaryUser) {
    ids.add(primaryUser.id);
  }
  
  c.shareLinks?.forEach((link: any) => {
    const u = users.find((usr) => usr.id === link.userId || usr.email === link.userId);
    if (u) {
      ids.add(u.id);
    }
  });

  const clientProjects = projects.filter((p) => p.clientId === c.id);
  clientProjects.forEach((p) => {
    p.team.forEach((teamId: string) => ids.add(teamId));
  });

  return Array.from(ids);
};

function ClientsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const industries = useMemo(
    () => Array.from(new Set(clients.map((c) => c.industry))).map((i) => ({ value: i, label: i })),
    [clients],
  );

  const filterDefs = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: [
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
          { value: "archived", label: "Archived" },
        ],
      },
      {
        id: "health",
        label: "Health",
        multi: true,
        options: [
          { value: "healthy", label: "Healthy", color: "#10B981" },
          { value: "watch", label: "Watch", color: "#F59E0B" },
          { value: "at-risk", label: "At risk", color: "#F43F5E" },
        ],
      },
      { id: "industry", label: "Industry", multi: true, options: industries },
    ],
    [industries],
  );

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const res = clients.filter((c) => {
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.contact.toLowerCase().includes(search.toLowerCase()) &&
        !(c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
      )
        return false;
      if (filters.status?.length && !filters.status.includes(c.status)) return false;
      if (filters.health?.length && !filters.health.includes(c.health)) return false;
      if (filters.industry?.length && !filters.industry.includes(c.industry)) return false;
      return true;
    });

    res.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "projects") {
        valA = projects.filter((p) => p.clientId === a.id).length;
        valB = projects.filter((p) => p.clientId === b.id).length;
      } else if (sortBy === "requests") {
        valA = a.openRequests || 0;
        valB = b.openRequests || 0;
      } else if (sortBy === "hours") {
        valA = a.hoursMonth || 0;
        valB = b.hoursMonth || 0;
      } else if (sortBy === "lastActivity") {
        valA = a.lastActivity || "";
        valB = b.lastActivity || "";
      } else if (sortBy === "since") {
        valA = a.since || "";
        valB = b.since || "";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return res;
  }, [clients, projects, search, filters, sortBy, sortOrder]);

  return (
    <AppShell
      title="Clients"
      subtitle={`${clients.length} clients · ${clients.filter((c) => c.status === "active").length} active`}
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
            onClick={() => open("client.new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add client
          </button>
        </>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search clients…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      <div>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSorted.map((c) => {
              const clientProjects = projects.filter((p) => p.clientId === c.id);
              return (
                <div
                  key={c.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85 hover:border-primary/25"
                >
                  <div
                    className="absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none bg-primary/5 group-hover:bg-primary/10"
                    style={{ backgroundColor: `${c.logoColor}10` }}
                  />

                  <Link href={`/owner/clients/${c.id}`} className="block space-y-4">
                    {/* Top row: Initial + Name/Industry */}
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white shadow-sm"
                        style={{ backgroundColor: c.logoColor }}
                      >
                        {c.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                            {c.name}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{c.industry}</p>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex gap-2 border-b border-border/40 pb-3 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", HEALTH_TONE[c.health]?.cls)}>
                        {HEALTH_TONE[c.health]?.label || c.health}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_TONE[c.status]?.cls)}>
                        {STATUS_TONE[c.status]?.label || c.status}
                      </span>
                      {c.retainer && (
                        <span className="font-semibold text-muted-foreground bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                          {c.retainer}
                        </span>
                      )}
                    </div>

                    {/* Quick Contacts */}
                    <div className="text-xs space-y-1.5 text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{c.contactEmail}</span>
                      </div>
                      {c.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className="truncate">{c.website.replace("https://", "")}</span>
                        </div>
                      )}
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5 text-xs pt-1">
                      <Stat label="Projects" value={clientProjects.length.toString()} />
                      <Stat label="Requests" value={c.openRequests.toString()} />
                      <Stat label="Hours / mo" value={c.hoursMonth.toString()} />
                    </div>
                  </Link>

                  {/* Footer actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                    <AvatarStack userIds={getClientUserIds(c, projects, users)} users={users} max={4} size={26} />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => open("client.status", { clientId: c.id })}
                        className="rounded-full border border-border/50 bg-background/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => open("client.edit", { clientId: c.id })}
                        className="rounded-full border border-border/50 bg-background/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="rounded-full border border-border/50 bg-background/30 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border border-border bg-card">
                          <DropdownMenuItem
                            onClick={() => open("client.share", { clientId: c.id })}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Invite client</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => open("client.archive", { clientId: c.id })}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span>Archive client</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => open("client.delete", { clientId: c.id })}
                            className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete client</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
                No clients match your filters.
              </div>
            )}
          </div>
        ) : (
          <div className="panel overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">
                      <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Client Name</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold">Primary Contact</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-center">
                      <button onClick={() => handleSort("projects")} className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Projects</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold text-center">
                      <button onClick={() => handleSort("requests")} className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Requests</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold text-center">
                      <button onClick={() => handleSort("hours")} className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Hours / mo</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold">
                      <button onClick={() => handleSort("lastActivity")} className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Last Activity</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold">
                      <button onClick={() => handleSort("since")} className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                        <span>Created Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAndSorted.map((c) => {
                    const clientProjects = projects.filter((p) => p.clientId === c.id);
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-semibold">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: c.logoColor }}
                            >
                              {c.name[0]}
                            </span>
                            <Link href={`/owner/clients/${c.id}`} className="hover:text-primary transition-colors truncate max-w-[180px] block">
                              {c.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-foreground">{c.contact}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{c.contactEmail}</div>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => open("client.status", { clientId: c.id })}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer",
                              STATUS_TONE[c.status]?.cls
                            )}
                          >
                            {STATUS_TONE[c.status]?.label || c.status}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-foreground">
                          {clientProjects.length}
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-foreground">
                          {c.openRequests}
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-foreground">
                          {c.hoursMonth}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs font-medium">
                          {c.lastActivity || "N/A"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs font-medium">
                          {c.since}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => open("client.edit", { clientId: c.id })}
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                            >
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
                                  onClick={() => open("client.share", { clientId: c.id })}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                  <span>Share Workspace</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => open("client.settings", { clientId: c.id })}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => open("client.archive", { clientId: c.id })}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  <span>Archive</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => open("client.delete", { clientId: c.id })}
                                  className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground bg-transparent">
                        No clients match your filters.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border/20 px-3 py-2 text-center hover:bg-muted/65 transition-colors">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/90">{label}</div>
      <div className="text-base font-bold mt-0.5 text-foreground leading-none">{value}</div>
    </div>
  );
}

export default ClientsPage;
