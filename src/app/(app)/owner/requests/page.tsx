"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { REQUEST_STATUS_META, REQUEST_TYPE_META, PRIORITY_META } from "@/lib/mock-data";
import {
  Plus,
  Wand2,
  CheckCircle2,
  XCircle,
  MessagesSquare,
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
  HelpCircle,
  Clock,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

const TYPE_ICONS: Record<string, any> = {
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
};

function RequestsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const requests = useStore((s) => s.requests);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: Object.entries(REQUEST_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "type",
        label: "Type",
        multi: true,
        options: Object.entries(REQUEST_TYPE_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "priority",
        label: "Priority",
        multi: true,
        options: Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "client",
        label: "Client",
        multi: true,
        options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
      },
    ],
    [clients],
  );

  const filtered = requests.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(r.status)) return false;
    if (filters.type?.length && !filters.type.includes(r.type)) return false;
    if (filters.priority?.length && !filters.priority.includes(r.priority)) return false;
    if (filters.client?.length && !filters.client.includes(r.clientId)) return false;
    if (!inRange(r.submittedAt, dateRange)) return false;
    return true;
  });

  return (
    <AppShell
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
            <Plus className="h-4 w-4" /> Log request
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
              needs_clarification: {
                cardHover: "hover:border-amber-500/25",
                glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
                badge: "bg-progress text-progress-foreground border-progress-foreground/20",
                textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
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
              rejected: {
                cardHover: "hover:border-rose-500/25",
                glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
                badge: "bg-todo text-todo-foreground border-todo-foreground/20",
                textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
              },
              converted_task: {
                cardHover: "hover:border-blue-500/25",
                glow: "bg-blue-500/5 group-hover:bg-blue-500/10",
                badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
              },
              converted_project: {
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
                  {/* Top Header Row: Icon Badge + Title & Client */}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                      accentCls.badge
                    )}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => open("request.review", { requestId: r.id })}
                        className="text-left block w-full group/title cursor-pointer"
                      >
                        <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2 hover:underline decoration-1", accentCls.textHover)}>
                          {r.title}
                        </h3>
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{client?.name}</p>
                    </div>
                  </div>

                  {/* Status & Priority Row */}
                  <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => open("request.review", { requestId: r.id })}
                        className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-90", sm.cls)}
                      >
                        {sm.label}
                      </button>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>
                        {pm.label}
                      </span>
                    </div>
                    <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                      {tm.label}
                    </span>
                  </div>

                  {/* Description & Submission info */}
                  <div className="space-y-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Submitted {r.submittedAt}</span>
                      {r.estimatedHours && (
                        <>
                          <span className="text-muted-foreground/30">•</span>
                          <span>Est: {r.estimatedHours}h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Section: Submitter & Action Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2">
                    {submitter && <UserAvatar user={submitter} size={26} />}
                    <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                      {submitter?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => open("request.review", { requestId: r.id })}
                      className="rounded-full border border-border/50 bg-background/30 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
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
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const client = clients.find((c) => c.id === r.clientId);
                const sm = REQUEST_STATUS_META[r.status];
                const tm = REQUEST_TYPE_META[r.type];
                const pm = PRIORITY_META[r.priority];
                const TypeIcon = TYPE_ICONS[tm.icon] || HelpCircle;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">
                      <button
                        onClick={() => open("request.review", { requestId: r.id })}
                        className="hover:text-primary transition-colors text-left font-semibold cursor-pointer"
                      >
                        {r.title}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{client?.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sm.cls}`}>{sm.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pm.cls}`}>{pm.label}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{tm.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.submittedAt}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => open("request.review", { requestId: r.id })}
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
    </AppShell>
  );
}

export default RequestsPage;
