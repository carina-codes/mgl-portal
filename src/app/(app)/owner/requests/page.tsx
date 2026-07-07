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
  List as ListIcon,
  Inbox,
  ArrowRightLeft,
  Calendar
} from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RichEditor } from "@/components/rich-editor";

const formatSubmissionTime = (submittedAt: string) => {
  if (!submittedAt) return "";
  const isRecent = 
    submittedAt.toLowerCase().includes("hour") ||
    submittedAt.toLowerCase().includes("min") ||
    submittedAt.toLowerCase().includes("now") ||
    submittedAt.toLowerCase().includes("today");
    
  if (isRecent) {
    return `Submitted ${submittedAt}`;
  }
  
  let dateVal = new Date();
  if (submittedAt.toLowerCase() === "yesterday" || submittedAt.toLowerCase() === "1 day ago") {
    dateVal.setDate(dateVal.getDate() - 1);
  } else if (submittedAt.toLowerCase().includes("days ago")) {
    const num = parseInt(submittedAt);
    if (!isNaN(num)) {
      dateVal.setDate(dateVal.getDate() - num);
    }
  } else {
    const parsed = new Date(submittedAt);
    if (!isNaN(parsed.getTime())) {
      dateVal = parsed;
    }
  }
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateFormatted = `${months[dateVal.getMonth()]} ${dateVal.getDate()}, ${dateVal.getFullYear()}`;
  
  const hours = String(dateVal.getHours()).padStart(2, "0");
  const mins = String(dateVal.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours}:${mins}`;
  
  return `Submitted on ${dateFormatted} ${timeFormatted}`;
};
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const TYPE_ICONS: Record<string, any> = {
  RefreshCw,
  ListPlus,
  FolderPlus,
  Upload,
  MessageCircleQuestion,
};

function RequestsView() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const requests = useStore((s) => s.requests);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    if (clientParam) {
      initial.client = [clientParam];
    }
    return initial;
  });

  useEffect(() => {
    if (clientParam) {
      setFilters((prev) => ({ ...prev, client: [clientParam] }));
    }
  }, [clientParam]);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const filterDefs = useMemo(
    () => [
      {
        id: "client",
        label: "Client",
        multi: true,
        options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
      },
      {
        id: "priority",
        label: "Priority",
        multi: true,
        options: Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
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
                        onClick={() => setSelectedRequestId(r.id)}
                        className="text-left block w-full group/title cursor-pointer"
                      >
                        <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2 decoration-1", accentCls.textHover)}>
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
                        onClick={() => setSelectedRequestId(r.id)}
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
                      <span>{formatSubmissionTime(r.submittedAt)}</span>
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
                      onClick={() => setSelectedRequestId(r.id)}
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
                        onClick={() => setSelectedRequestId(r.id)}
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
                        onClick={() => setSelectedRequestId(r.id)}
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

      {/* Hoisted Request Details Drawer */}
      <RequestDetailsDrawer requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />
    </AppShell>
  );
}

function RequestDetailsDrawer({
  requestId,
  onClose,
}: {
  requestId: string | null;
  onClose: () => void;
}) {
  const requests = useStore((s) => s.requests);
  const req = useMemo(() => requests.find((r) => r.id === requestId), [requests, requestId]);
  const clients = useStore((s) => s.clients);
  const client = useMemo(() => req ? clients.find((c) => c.id === req.clientId) : null, [req, clients]);
  const setStatus = useStore((s) => s.setRequestStatus);
  const { open } = useModals();
  const [busy, setBusy] = useState(false);
  const [internalNote, setInternalNote] = useState("");

  if (!req || !client) return null;

  const tm = REQUEST_TYPE_META[req.type];
  const pm = PRIORITY_META[req.priority];
  const sm = REQUEST_STATUS_META[req.status];

  const handleApprove = async () => {
    setBusy(true);
    try {
      await setStatus(req.id, "approved");
      toast.success("Request approved");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80 flex flex-col justify-between h-full">
        <div className="space-y-6">
          <SheetHeader className="text-left">
            <SheetTitle className="sr-only">Request Details: {req.title}</SheetTitle>
            <SheetDescription className="sr-only">View and review details for request {req.title}</SheetDescription>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", sm.cls)}>{sm.label}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{tm.label}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>{pm.label}</span>
              {req.estimatedHours && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">~{req.estimatedHours}h estimate</span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground leading-snug">{req.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">From {client.name} · {req.submittedAt}</p>
          </SheetHeader>

          {/* Description */}
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {req.description}
          </div>

          {/* Internal Note */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Internal note</label>
            <RichEditor
              value={internalNote}
              onChange={setInternalNote}
              placeholder="Add context for the team before deciding…"
              minHeight={100}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-4 mt-6">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted cursor-pointer transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              open("request.convertTask", { requestId: req.id });
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer transition-all text-foreground"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" /> Convert to task
          </button>
          <button
            onClick={() => {
              open("request.convertProject", { requestId: req.id });
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer transition-all text-foreground"
          >
            <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" /> Convert to project
          </button>
          <button
            onClick={() => {
              open("request.close", { requestId: req.id });
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 cursor-pointer transition-all"
          >
            <XCircle className="h-3.5 w-3.5" /> Close
          </button>
          <button
            disabled={busy}
            onClick={handleApprove}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsView />
    </Suspense>
  );
}

export default RequestsPage;
