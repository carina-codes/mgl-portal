"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

const getExtendedUsers = (client: any, users: any[]) => {
  const list = [...users];
  if (!client) return list;
  
  if (client.contactEmail && !list.some((u) => u.email === client.contactEmail)) {
    list.push({
      id: client.contactEmail,
      name: client.contact,
      email: client.contactEmail,
      role: "client",
      title: client.contactRole || "Primary Contact",
      avatar: client.contact.split(" ").map((n: string) => n[0]).join(""),
      color: client.logoColor || "#0049FE",
    });
  }
  
  client.additionalContacts?.forEach((contact: any) => {
    if (contact.email && !list.some((u) => u.email === contact.email)) {
      list.push({
        id: contact.email,
        name: contact.name,
        email: contact.email,
        role: "client",
        title: contact.title || "Contact",
        avatar: contact.name.split(" ").map((n: string) => n[0]).join(""),
        color: client.logoColor || "#0049FE",
      });
    }
  });
  
  return list;
};

const getClientUserIds = (c: any, users: any[]) => {
  const ids = new Set<string>();
  
  const primaryUser = users.find((u) => u.email === c.contactEmail);
  ids.add(primaryUser ? primaryUser.id : c.contactEmail);
  
  c.additionalContacts?.forEach((contact: any) => {
    const u = users.find((usr) => usr.email === contact.email);
    ids.add(u ? u.id : contact.email);
  });

  c.shareLinks?.forEach((link: any) => {
    const u = users.find((usr) => usr.id === link.userId || usr.email === link.userId);
    if (u) {
      if (u.role === "client") {
        ids.add(u.id);
      }
    } else {
      if (link.userId.includes("@") && !link.userId.endsWith("@carina.studio")) {
        ids.add(link.userId);
      }
    }
  });

  return Array.from(ids);
};

function ClientsPage() {
  const router = useRouter();
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
        !(
          (c.industry && c.industry.toLowerCase().includes(search.toLowerCase())) ||
          (c.subIndustry && c.subIndustry.toLowerCase().includes(search.toLowerCase()))
        )
      )
        return false;
      if (filters.status?.length && !filters.status.includes(c.status)) return false;
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
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-white dark:bg-card p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-white hover:border-primary/25 cursor-pointer"
                  onClick={() => open("client.edit", { clientId: c.id })}
                >
                  <div
                    className="absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none bg-primary/5 group-hover:bg-primary/10"
                    style={{ backgroundColor: `${c.logoColor}10` }}
                  />

                  <div className="block space-y-4">
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
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                          {c.industry}{c.subIndustry ? ` · ${c.subIndustry}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Display Flex: Status Tag (Left), Website URL (Right) */}
                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_TONE[c.status]?.cls)}>
                        {STATUS_TONE[c.status]?.label || c.status}
                      </span>
                      {c.website && (
                        <a
                          href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className="truncate">{c.website.replace("https://", "").replace("http://", "")}</span>
                        </a>
                      )}
                    </div>

                    {/* Contact Name & Email Row */}
                    <div className="text-xs flex items-center justify-between text-muted-foreground font-medium border-b border-border/40 pb-3">
                      <span className="truncate text-foreground font-semibold">{c.contact}</span>
                      <span className="truncate">{c.contactEmail}</span>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5 text-xs pt-1" onClick={(e) => e.stopPropagation()}>
                      <Stat label="Projects" value={clientProjects.length.toString()} href={`/owner/projects?client=${c.id}`} />
                      <Stat label="Requests" value={c.openRequests.toString()} href={`/owner/requests?client=${c.id}`} />
                      <Stat label="Hours / mo" value={c.hoursMonth.toString()} />
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                    <AvatarStack userIds={getClientUserIds(c, users)} users={getExtendedUsers(c, users)} max={4} size={26} />
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => open("client.edit", { clientId: c.id })}
                        className="rounded-full border border-border/50 bg-background/30 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                      >
                        View
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
                              const newStatus = c.status === "active" ? "paused" : "active";
                              useStore.getState().updateClient(c.id, { status: newStatus });
                              toast.success(`Client ${newStatus === "active" ? "activated" : "paused"}`);
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span>{c.status === "active" ? "Pause client" : "Activate client"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const origin = typeof window !== "undefined" ? window.location.origin : "";
                              const token = c.clientShareToken || Math.random().toString(36).substring(2, 10);
                              if (!c.clientShareToken) {
                                useStore.getState().updateClient(c.id, { clientShareToken: token });
                              }
                              navigator.clipboard.writeText(`${origin}/client?token=${token}`);
                              toast.success("Access link copied to clipboard");
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span>Copy access link</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => open("client.delete", { clientId: c.id })}
                            className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                          >
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
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Projects</th>
                    <th className="px-5 py-3 font-medium">Requests</th>
                    <th className="px-5 py-3 font-medium">Hours</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((c) => {
                    const clientProjects = projects.filter((p) => p.clientId === c.id);
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white border border-black/10"
                              style={{ backgroundColor: c.logoColor }}
                            >
                              {c.name[0]}
                            </span>
                            <button
                              onClick={() => open("client.edit", { clientId: c.id })}
                              className="hover:text-primary transition-colors text-left font-medium"
                            >
                              {c.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="text-foreground">{c.contact}</span>
                            <span className="text-[11px]">{c.contactEmail}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => open("client.status", { clientId: c.id })}
                            className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_TONE[c.status]?.cls)}
                          >
                            {STATUS_TONE[c.status]?.label || c.status}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <Link href={`/owner/projects?client=${c.id}`} className="hover:text-primary transition-colors font-medium">
                            {clientProjects.length}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <Link href={`/owner/requests?client=${c.id}`} className="hover:text-primary transition-colors font-medium">
                            {c.openRequests}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{c.hoursMonth}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => open("client.edit", { clientId: c.id })}
                              className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                            >
                              View
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
                                    const newStatus = c.status === "active" ? "paused" : "active";
                                    useStore.getState().updateClient(c.id, { status: newStatus });
                                    toast.success(`Client ${newStatus === "active" ? "activated" : "paused"}`);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <span>{c.status === "active" ? "Pause client" : "Activate client"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                                    const token = c.clientShareToken || Math.random().toString(36).substring(2, 10);
                                    if (!c.clientShareToken) {
                                      useStore.getState().updateClient(c.id, { clientShareToken: token });
                                    }
                                    navigator.clipboard.writeText(`${origin}/client?token=${token}`);
                                    toast.success("Access link copied to clipboard");
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <span>Copy access link</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => open("client.delete", { clientId: c.id })}
                                  className="flex items-center gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/5 cursor-pointer"
                                >
                                  <span>Delete client</span>
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
                      <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground bg-transparent">
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

export default ClientsPage;
