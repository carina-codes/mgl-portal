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
  Calendar,
  Lock
} from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";

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
  
  const hours24 = dateVal.getHours();
  const ampm = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;
  const mins = String(dateVal.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours12}:${mins}${ampm}`;
  
  return `Submitted on ${dateFormatted} at ${timeFormatted}`;
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

function NewCommentForm({ threadId }: { threadId: string }) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const projectId = useStore((s) => s.requests.find((r) => r.id === threadId)?.projectId || "p1");

  const handleSubmit = () => {
    if (!commentText.trim() && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: !isInternal,
      });
      return doc.id;
    });

    createComment({
      threadId,
      author: "u1", // Owner: Carina Rivera
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
      attachments: docIds,
    });
    setCommentText("");
    setAttachments([]);
    toast.success("Comment posted successfully");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0 || attachments.length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      placeholder="Post a reply..."
      minHeight={80}
      compact
      onSend={handleSubmit}
      sendDisabled={!isEnabled}
      showInternalOnly
      isInternal={isInternal}
      onInternalChange={setIsInternal}
    />
  );
}

export function RequestDetailsDrawer({
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
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === requestId), [allComments, requestId]);
  const setStatus = useStore((s) => s.setRequestStatus);
  const { open } = useModals();
  const [busy, setBusy] = useState(false);

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
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="sr-only">Request Details: {req.title}</SheetTitle>
            <SheetDescription className="sr-only">View and edit details for request {req.title}</SheetDescription>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", sm.cls)}>
                {sm.label}
              </span>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                {tm.label}
              </span>
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pm.cls)}>
                {pm.label}
              </span>
            </div>
            {client && (
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                {client.name}
              </div>
            )}
            <input
              type="text"
              value={req.title}
              onChange={(e) => useStore.getState().updateRequest(req.id, { title: e.target.value })}
              className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-primary rounded-xl px-1 text-foreground"
            />
            {req.submittedAt && (
              <div className="text-xs text-muted-foreground mt-1.5 px-1 font-medium">
                {formatSubmissionTime(req.submittedAt)}
              </div>
            )}
          </SheetHeader>

          {/* Form fields */}
          <div className="space-y-4 text-sm border-b border-border pb-6 mb-6">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-medium">Status:</span>
              <select
                value={req.status}
                onChange={(e) => setStatus(req.id, e.target.value as RequestStatus)}
                className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                {(["submitted", "under_review", "closed", "approved", "convert"] as RequestStatus[]).map((s) => (
                  <option key={s} value={s}>{REQUEST_STATUS_META[s].label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-medium">Priority:</span>
              <select
                value={req.priority}
                onChange={(e) => useStore.getState().updateRequest(req.id, { priority: e.target.value as Priority })}
                className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-medium">Type:</span>
              <select
                value={req.type}
                onChange={(e) => useStore.getState().updateRequest(req.id, { type: e.target.value as RequestType })}
                className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                {(["revision", "new_task", "new_project", "meeting", "question"] as RequestType[]).map((t) => (
                  <option key={t} value={t}>{REQUEST_TYPE_META[t].label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-medium">Client:</span>
              <div className="col-span-2 text-xs font-semibold px-2.5 py-1.5 text-foreground bg-muted/30 rounded-xl border border-border/40">
                {client.name}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-medium">Project:</span>
              <select
                value={req.projectId ?? ""}
                onChange={(e) => useStore.getState().updateRequest(req.id, { projectId: e.target.value || undefined })}
                className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                <option value="">— None —</option>
                {projects.filter((p) => p.clientId === req.clientId).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
            <RichEditor
              value={req.description}
              onChange={(v) => useStore.getState().updateRequest(req.id, { description: v })}
              placeholder="Add detailed description notes here..."
              minHeight={120}
            />
          </div>

          {/* Discussion Feed */}
          <div className="border-t border-border/80 pt-6">
            <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center justify-between">
              <span>Thread Discussion</span>
              <span className="text-xs text-muted-foreground font-normal">{comments.length} comments</span>
            </h4>
            <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
              {comments.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
                  No discussion comments yet. Write one below!
                </div>
              ) : (
                comments.map((c) => {
                  const u = users.find((x) => x.id === c.author);
                  const isInternal = c.visibility === "internal";
                  if (!u) return null;
                  return (
                    <div key={c.id} className="flex gap-2.5 text-xs">
                      <UserAvatar user={u} size={24} />
                      <div className={cn("flex-1 rounded-2xl px-3.5 py-2.5", isInternal ? "bg-amber-500/10 border border-amber-500/25" : "bg-muted")}>
                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{u.name}</span>
                          <span>{c.createdAt}</span>
                        </div>
                        <FormattedBody html={c.body} />
                        <CommentAttachmentsList attachmentIds={c.attachments} />
                        {isInternal && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                            <Lock className="h-2 w-2" /> Internal note
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form */}
            <NewCommentForm threadId={req.id} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-4 mt-6">
          <button
            onClick={onClose}
            className="mr-auto rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted cursor-pointer transition-all"
          >
            Cancel
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
