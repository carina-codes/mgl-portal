"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { useActiveTeamMember } from "@/hooks/use-active-team-member";
import { REQUEST_STATUS_META, REQUEST_TYPE_META, PRIORITY_META } from "@/lib/mock-data";
import {
  Plus,
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
  HelpCircle,
  Clock,
  LayoutGrid,
  List as ListIcon,
  MessagesSquare,
  ShieldAlert,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn, stripHtml } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { RequestDetailsDrawer } from "@/app/(app)/owner/requests/page";

const TYPE_ICONS: Record<string, any> = {
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
};

const formatSubmissionTime = (submittedAt: string) => {
  if (!submittedAt) return "";
  const isRecent =
    submittedAt.toLowerCase().includes("hour") ||
    submittedAt.toLowerCase().includes("min") ||
    submittedAt.toLowerCase().includes("now") ||
    submittedAt.toLowerCase().includes("today");
  if (isRecent) return `Submitted ${submittedAt}`;
  let dateVal = new Date();
  if (submittedAt.toLowerCase() === "yesterday" || submittedAt.toLowerCase() === "1 day ago") {
    dateVal.setDate(dateVal.getDate() - 1);
  } else if (submittedAt.toLowerCase().includes("days ago")) {
    const num = parseInt(submittedAt);
    if (!isNaN(num)) dateVal.setDate(dateVal.getDate() - num);
  } else {
    const parsed = new Date(submittedAt);
    if (!isNaN(parsed.getTime())) dateVal = parsed;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateFormatted = `${months[dateVal.getMonth()]} ${dateVal.getDate()}, ${dateVal.getFullYear()}`;
  const hours24 = dateVal.getHours();
  const ampm = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  const mins = String(dateVal.getMinutes()).padStart(2, "0");
  return `Submitted on ${dateFormatted} at ${hours12}:${mins}${ampm}`;
};

type RequestSortField = "title" | "client" | "status" | "priority" | "type" | "submitted";

const REQUEST_PRIORITY_SORT: Record<string, number> = { low: 1, medium: 2, high: 3 };

function TeamRequestsView() {
  const { member, isManager } = useActiveTeamMember();
  const [view, setView] = useState<"grid" | "list">("grid");
  const requests = useStore((s) => s.requests);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<RequestSortField>("submitted");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: RequestSortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filterDefs = useMemo(
    () => [
      { id: "client", label: "Client", multi: true, options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })) },
      { id: "priority", label: "Priority", multi: true, options: Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label })) },
      { id: "status", label: "Status", multi: true, options: Object.entries(REQUEST_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })) },
      { id: "type", label: "Type", multi: true, options: Object.entries(REQUEST_TYPE_META).map(([v, m]) => ({ value: v, label: m.label })) },
    ],
    [clients],
  );

  const filtered = useMemo(() => {
    const result = requests.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.status?.length && !filters.status.includes(r.status)) return false;
      if (filters.type?.length && !filters.type.includes(r.type)) return false;
      if (filters.priority?.length && !filters.priority.includes(r.priority)) return false;
      if (filters.client?.length && !filters.client.includes(r.clientId)) return false;
      if (!inRange(r.submittedAt, dateRange)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortBy === "client") {
        valA = clients.find((c) => c.id === a.clientId)?.name || "";
        valB = clients.find((c) => c.id === b.clientId)?.name || "";
      } else if (sortBy === "status") {
        valA = REQUEST_STATUS_META[a.status]?.label || "";
        valB = REQUEST_STATUS_META[b.status]?.label || "";
      } else if (sortBy === "priority") {
        valA = REQUEST_PRIORITY_SORT[a.priority] || 0;
        valB = REQUEST_PRIORITY_SORT[b.priority] || 0;
      } else if (sortBy === "type") {
        valA = REQUEST_TYPE_META[a.type]?.label || "";
        valB = REQUEST_TYPE_META[b.type]?.label || "";
      } else if (sortBy === "submitted") {
        valA = new Date(a.submittedAt).getTime() || 0;
        valB = new Date(b.submittedAt).getTime() || 0;
      } else {
        valA = a.title;
        valB = b.title;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [requests, search, filters, dateRange, sortBy, sortOrder, clients]);

  if (!isManager) {
    return (
      <AppShell role="team" title="Requests">
        <div className="panel grid place-items-center gap-3 p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Manager access required</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Request management is only available to team members with the manager role.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="team"
      title="Requests"
      subtitle={`${requests.length} requests · ${requests.filter((r) => r.status === "submitted").length} need first review`}
      actions={
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button onClick={() => setView("grid")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <button
            onClick={() => open("request.new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add request
          </button>
        </>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search requests…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
        dateRange={dateRange}
        onDateRange={setDateRange}
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const client = clients.find((c) => c.id === r.clientId);
            const submitter = users.find((u) => u.id === r.submittedBy);
            const sm = REQUEST_STATUS_META[r.status];
            const tm = REQUEST_TYPE_META[r.type];
            const pm = PRIORITY_META[r.priority];
            const TypeIcon = TYPE_ICONS[tm.icon] || HelpCircle;

            const accentCls = {
              submitted: {
                cardHover: "hover:border-sky-500/25",
                glow: "bg-sky-500/5 group-hover:bg-sky-500/10",
                badge: "bg-review text-review-foreground border-review-foreground/20",
                textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
              },
              under_review: {
                cardHover: "hover:border-violet-500/25",
                glow: "bg-violet-500/5 group-hover:bg-violet-500/10",
                badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
                textHover: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
              },
              approved: {
                cardHover: "hover:border-emerald-500/25",
                glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
                badge: "bg-done text-done-foreground border-done-foreground/20",
                textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
              },
              closed: {
                cardHover: "hover:border-rose-500/25",
                glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
                badge: "bg-todo text-todo-foreground border-todo-foreground/20",
                textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
              },
              convert: {
                cardHover: "hover:border-blue-500/25",
                glow: "bg-blue-500/5 group-hover:bg-blue-500/10",
                badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
              },
            }[r.status] || {
              cardHover: "hover:border-primary/25",
              glow: "bg-primary/5 group-hover:bg-primary/10",
              badge: "bg-muted text-muted-foreground border-muted-foreground/20",
              textHover: "group-hover:text-primary",
            };

            return (
              <div key={r.id} className={cn("group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}>
                <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300", accentCls.badge)}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setSelectedRequestId(r.id)} className="text-left block w-full group/title cursor-pointer">
                        <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2 decoration-1", accentCls.textHover)}>
                          {r.title}
                        </h3>
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{client?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelectedRequestId(r.id)} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-90", sm.cls)}>
                        {sm.label}
                      </button>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>{pm.label}</span>
                    </div>
                    <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">{tm.label}</span>
                  </div>

                  <div className="space-y-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{stripHtml(r.description)}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatSubmissionTime(r.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2">
                    {submitter && <UserAvatar user={submitter} size={26} />}
                    <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">{submitter?.name}</span>
                  </div>
                  <button onClick={() => setSelectedRequestId(r.id)} className="rounded-full border border-border/50 bg-background/30 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
                    Review
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <MessagesSquare className="h-6 w-6 text-muted-foreground/60" />
              No requests match your filters.
            </div>
          )}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th onClick={() => handleSort("title")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Request {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("client")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Client {sortBy === "client" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("type")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("priority")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("status")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => handleSort("submitted")} className="px-5 py-3 font-medium cursor-pointer hover:text-foreground select-none">
                  Submitted {sortBy === "submitted" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const client = clients.find((c) => c.id === r.clientId);
                const sm = REQUEST_STATUS_META[r.status];
                const tm = REQUEST_TYPE_META[r.type];
                const pm = PRIORITY_META[r.priority];
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setSelectedRequestId(r.id)}>
                    <td className="px-5 py-3 font-medium max-w-xs truncate">{r.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{client?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{tm.label}</td>
                    <td className="px-5 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", pm.cls)}>{pm.label}</span></td>
                    <td className="px-5 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", sm.cls)}>{sm.label}</span></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{r.submittedAt}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedRequestId(r.id); }}
                        className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted cursor-pointer transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 justify-center">
                      <MessagesSquare className="h-6 w-6 text-muted-foreground/60" />
                      No requests match your filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RequestDetailsDrawer requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} authorId={member.id} />
    </AppShell>
  );
}

export default TeamRequestsView;
