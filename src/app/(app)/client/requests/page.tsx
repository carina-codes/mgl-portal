"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import {
  REQUEST_STATUS_META,
  REQUEST_TYPE_META,
  PRIORITY_META,
  type RequestType,
  type Priority,
  type Document,
} from "@/lib/mock-data";
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
  CircleX,
  Eye,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { AppDialog, FieldGroup, FieldLabel, SelectField, TextField } from "@/components/ui/app-dialog";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { Button as BaseButton } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function Button({ className, ...props }: React.ComponentProps<typeof BaseButton>) {
  return <BaseButton className={cn("rounded-full font-semibold", className)} {...props} />;
}

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

function PortalRequests() {
  const { client } = useActiveClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const allRequests = useStore((s) => s.requests);
  const allProjects = useStore((s) => s.projects);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const myRequests = useMemo(() => allRequests.filter((r) => r.clientId === client.id), [allRequests, client.id]);
  const myProjects = useMemo(() => allProjects.filter((p) => p.clientId === client.id), [allProjects, client.id]);

  const filterDefs = useMemo(
    () => [
      { id: "priority", label: "Priority", multi: true, options: Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label })) },
      { id: "status", label: "Status", multi: true, options: Object.entries(REQUEST_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })) },
      { id: "type", label: "Type", multi: true, options: Object.entries(REQUEST_TYPE_META).map(([v, m]) => ({ value: v, label: m.label })) },
    ],
    [],
  );

  const filtered = myRequests.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(r.status)) return false;
    if (filters.type?.length && !filters.type.includes(r.type)) return false;
    if (filters.priority?.length && !filters.priority.includes(r.priority)) return false;
    if (!inRange(r.submittedAt, dateRange)) return false;
    return true;
  });

  return (
    <AppShell
      role="client"
      title="Requests"
      subtitle={`${myRequests.length} requests · Submit, track, and follow up`}
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
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Submit request
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
              <button
                key={r.id}
                onClick={() => setSelectedRequestId(r.id)}
                className={cn("group relative flex flex-col justify-between text-left rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85", accentCls.cardHover)}
              >
                <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300", accentCls.badge)}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight line-clamp-2", accentCls.textHover)}>
                        {r.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", sm.cls)}>{sm.label}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", pm.cls)}>{pm.label}</span>
                    </div>
                    <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">{tm.label}</span>
                  </div>

                  <div className="space-y-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatSubmissionTime(r.submittedAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
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
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sm = REQUEST_STATUS_META[r.status];
                const tm = REQUEST_TYPE_META[r.type];
                const pm = PRIORITY_META[r.priority];
                const TypeIcon = TYPE_ICONS[tm.icon] || HelpCircle;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">
                      <button onClick={() => setSelectedRequestId(r.id)} className="hover:text-primary transition-colors text-left font-semibold cursor-pointer">
                        {r.title}
                      </button>
                    </td>
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
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
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

      <NewRequestDialog open={isNewOpen} onOpenChange={setIsNewOpen} clientId={client.id} projects={myProjects} />
      <RequestDetailsDrawer requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} clientId={client.id} />
    </AppShell>
  );
}

export default PortalRequests;

/* ---------- New request ---------- */

function NewRequestDialog({
  open,
  onOpenChange,
  clientId,
  projects,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  const create = useStore((s) => s.createRequest);
  const [form, setForm] = useState({
    projectId: "",
    type: "revision" as RequestType,
    title: "",
    description: "",
    priority: "medium" as Priority,
  });
  const valid = form.title.trim().length > 1;

  const reset = () => setForm({ projectId: "", type: "revision", title: "", description: "", priority: "medium" });

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
      title="Submit a request"
      description="Your team will review and respond — nothing goes into active work without scope approval."
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              create({
                clientId,
                submittedBy: `client-${clientId}`,
                type: form.type,
                title: form.title,
                description: form.description,
                priority: form.priority,
                projectId: form.projectId || undefined,
              });
              toast.success("Request submitted");
              onOpenChange(false);
              reset();
            }}
          >
            Submit request
          </Button>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RequestType })}>
            {(Object.keys(REQUEST_TYPE_META) as RequestType[]).map((t) => (
              <option key={t} value={t}>{REQUEST_TYPE_META[t].label}</option>
            ))}
          </SelectField>
          <SelectField label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            ))}
          </SelectField>
        </div>

        <SelectField label="Project (optional)" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
          <option value="">— None —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>

        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summarize the ask" />
        <div>
          <FieldLabel>Details</FieldLabel>
          <RichEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Add context, references or success criteria…" minHeight={140} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

/* ---------- Request detail (read-only status, reply thread) ---------- */

function NewReplyForm({ threadId, clientId, projectId }: { threadId: string; clientId: string; projectId?: string }) {
  const { client } = useActiveClient();
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);

  const handleSubmit = () => {
    if (!commentText.replace(/<[^>]+>/g, "").trim() && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId: projectId || "",
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: true,
      });
      return doc.id;
    });

    createComment({
      threadId,
      author: `client-${clientId}`,
      body: commentText.trim(),
      visibility: "client",
      attachments: docIds,
    });
    setCommentText("");
    setAttachments([]);
    toast.success("Reply posted");
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
    />
  );
}

function RequestDetailsDrawer({
  requestId,
  onClose,
  clientId,
}: {
  requestId: string | null;
  onClose: () => void;
  clientId: string;
}) {
  const { client } = useActiveClient();
  const requests = useStore((s) => s.requests);
  const req = useMemo(() => requests.find((r) => r.id === requestId), [requests, requestId]);
  const setStatus = useStore((s) => s.setRequestStatus);
  const users = useStore((s) => s.users);
  const documents = useStore((s) => s.documents);
  const [previewFile, setPreviewFile] = useState<Document | null>(null);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(
    () => allComments.filter((c) => c.threadId === requestId && c.visibility !== "internal"),
    [allComments, requestId],
  );

  const requestDocuments = useMemo(() => {
    if (!req) return [];
    const ids = req.attachmentDocIds ?? [];
    return documents.filter((d) => ids.includes(d.id) && d.shared);
  }, [req, documents]);

  const clientAsUser = useMemo(
    () => ({
      id: `client-${client.id}`,
      name: client.contact,
      email: client.contactEmail,
      role: "client" as const,
      title: client.contactRole || client.name,
      avatar: client.contactAvatar || client.contact.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2),
      color: client.logoColor,
    }),
    [client],
  );
  const resolveUser = (authorId: string) => users.find((u) => u.id === authorId) || (authorId === clientAsUser.id ? clientAsUser : null);

  if (!req) return null;

  const tm = REQUEST_TYPE_META[req.type];
  const pm = PRIORITY_META[req.priority];
  const sm = REQUEST_STATUS_META[req.status];

  return (
    <>
    <Sheet open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80 flex flex-col justify-between h-full">
        <div className="space-y-6">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="sr-only">Request Details: {req.title}</SheetTitle>
            <SheetDescription className="sr-only">View details and discussion for request {req.title}</SheetDescription>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", sm.cls)}>{sm.label}</span>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">{tm.label}</span>
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pm.cls)}>{pm.label}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground m-0">{req.title}</h2>
            {req.submittedAt && (
              <div className="text-xs text-muted-foreground mt-0 px-0 font-medium">{formatSubmissionTime(req.submittedAt)}</div>
            )}
          </SheetHeader>

          {req.description && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
              <div className="text-sm text-foreground/90 leading-relaxed rounded-2xl border border-border/60 bg-muted/20 p-4">
                <FormattedBody html={req.description} />
              </div>
            </div>
          )}

          {requestDocuments.length > 0 && (
            <div className="border-t border-border/80 pt-6 mt-6 mb-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Attachments</span>
                <span className="text-xs text-muted-foreground font-normal capitalize tracking-normal">
                  {requestDocuments.length} {requestDocuments.length === 1 ? "file" : "files"}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requestDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-2.5 rounded-xl transition-all group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                        {doc.name.split(".").pop()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate" title={doc.name}>{doc.name}</div>
                        <div className="text-[10px] text-muted-foreground">{doc.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(doc)}
                        className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-all cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  const u = resolveUser(c.author);
                  if (!u) return null;
                  return (
                    <div key={c.id} className="flex gap-2.5 text-xs">
                      <UserAvatar user={u} size={24} />
                      <div className="flex-1 rounded-2xl px-3.5 py-2.5 bg-muted">
                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{u.name}</span>
                          <span>{c.createdAt}</span>
                        </div>
                        <FormattedBody html={c.body} />
                        <CommentAttachmentsList attachmentIds={c.attachments} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <NewReplyForm threadId={req.id} clientId={clientId} projectId={req.projectId} />
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 border-t border-border/40 pt-4 mt-6">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setStatus(req.id, "withdrawn");
              toast.success("Request withdrawn");
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 cursor-pointer transition-all"
          >
            <CircleX className="h-3.5 w-3.5" /> Withdraw request
          </button>
        </div>
      </SheetContent>
    </Sheet>
    <FilePreviewDialog
      file={previewFile}
      onClose={() => setPreviewFile(null)}
      onDownload={(f) => toast.success(`Downloading ${f.name}...`)}
    />
    </>
  );
}
