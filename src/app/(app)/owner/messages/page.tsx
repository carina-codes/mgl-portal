"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UserAvatar, AvatarStack } from "@/components/user-avatar";
import { useModals } from "@/components/modals";
import { STAGE_META, REQUEST_STATUS_META } from "@/lib/mock-data";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Lock, FolderKanban, MessageSquare, Search, MessageCircle, ListTodo, Eye } from "lucide-react";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { useStore, projectMemberIds } from "@/lib/store";
import { toast } from "sonner";
import { TaskDetailsDrawer } from "@/app/(app)/owner/projects/view/view";
import { useCurrentUser } from "@/lib/role-context";
import { checkNameAllowed } from "@/lib/upload-validation";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-violet-100 dark:bg-violet-950/45 text-violet-800 dark:text-violet-300" },
  manager: { label: "Manager", cls: "bg-indigo-100 dark:bg-indigo-950/45 text-indigo-800 dark:text-indigo-300" },
  team: { label: "Team", cls: "bg-blue-100 dark:bg-blue-950/45 text-blue-800 dark:text-blue-300" },
};

function MessagesPage() {
  const comments = useStore((s) => s.comments);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const requests = useStore((s) => s.requests);
  const storeUsers = useStore((s) => s.users);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const createComment = useStore((s) => s.createComment);
  const channels = useStore((s) => s.channels);
  const markChannelAsRead = useStore((s) => s.markChannelAsRead);
  const currentUserId = useCurrentUser().id;
  const { open } = useModals();

  const [active, setActive] = useState("");
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [taskUnread, setTaskUnread] = useState<Record<string, number>>({
    "p1-t1": 1,
    "p1-t5": 2,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get list of unique threadIds: only if there is a comment/message in them
  const activeThreadIds = useMemo(() => {
    const ids = new Set<string>();
    
    comments.forEach((c) => {
      if (c.threadId) {
        const isProject = projects.some((p) => p.id === c.threadId);
        const isRequest = requests.some((r) => r.id === c.threadId);
        const isTask = tasks.some((t) => t.id === c.threadId);
        if (isProject || isRequest || isTask) {
          ids.add(c.threadId);
        }
      }
    });

    return Array.from(ids);
  }, [comments, projects, requests, tasks]);

  // Construct thread details dynamically
  const threads = useMemo(() => {
    return activeThreadIds
      .map((threadId) => {
        const proj = projects.find((p) => p.id === threadId);
        if (proj) {
          const cl = clients.find((c) => c.id === proj.clientId);
          const threadComments = comments.filter((c) => c.threadId === threadId);
          const lastComment = threadComments[threadComments.length - 1];
          const authorUser = lastComment ? storeUsers.find((u) => u.id === lastComment.author) : null;
          
          return {
            id: threadId,
            type: "project" as const,
            name: proj.name,
            subtitle: `${cl?.name || "Internal"} · General Chat`,
            project: proj,
            client: cl,
            lastMessage: lastComment 
              ? `${authorUser ? authorUser.name.split(" ")[0] : "User"}: ${lastComment.body.replace(/<[^>]+>/g, "")}` 
              : "No messages",
            lastAt: lastComment ? lastComment.createdAt : "",
            unread: 0,
          };
        }

        const t = tasks.find((tsk) => tsk.id === threadId);
        if (t) {
          const tProj = projects.find((p) => p.id === t.projectId);
          const cl = tProj ? clients.find((c) => c.id === tProj.clientId) : undefined;
          const threadComments = comments.filter((c) => c.threadId === threadId);
          const lastComment = threadComments[threadComments.length - 1];
          const authorUser = lastComment ? storeUsers.find((u) => u.id === lastComment.author) : null;
          
          return {
            id: threadId,
            type: "task" as const,
            name: t.title,
            subtitle: `${cl?.name || "Internal"} · Task Thread`,
            project: tProj,
            client: cl,
            lastMessage: lastComment 
              ? `${authorUser ? authorUser.name.split(" ")[0] : "User"}: ${lastComment.body.replace(/<[^>]+>/g, "")}` 
              : "No messages",
            lastAt: lastComment ? lastComment.createdAt : "",
            unread: 0,
          };
        }

        const req = requests.find((r) => r.id === threadId);
        if (req) {
          const cl = clients.find((c) => c.id === req.clientId);
          const reqProj = req.projectId ? projects.find((p) => p.id === req.projectId) : undefined;
          const threadComments = comments.filter((c) => c.threadId === threadId);
          const lastComment = threadComments[threadComments.length - 1];
          const authorUser = lastComment ? storeUsers.find((u) => u.id === lastComment.author) : null;
          
          return {
            id: threadId,
            type: "request" as const,
            name: req.title,
            subtitle: `${cl?.name || "Internal"} · Request Thread`,
            project: reqProj,
            client: cl,
            lastMessage: lastComment 
              ? `${authorUser ? authorUser.name.split(" ")[0] : "User"}: ${lastComment.body.replace(/<[^>]+>/g, "")}` 
              : "No messages",
            lastAt: lastComment ? lastComment.createdAt : "",
            unread: 0,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
        id: string;
        type: "project" | "task" | "request";
        name: string;
        subtitle: string;
        project?: any;
        client?: any;
        lastMessage: string;
        lastAt: string;
        unread: number;
      }>;
  }, [activeThreadIds, projects, clients, tasks, requests, comments, storeUsers]);

  // Ensure active thread is valid
  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === active) || threads[0];
  }, [threads, active]);

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const matchName = t.name.toLowerCase().includes(chatSearch.toLowerCase());
      const matchLastMsg = t.lastMessage.toLowerCase().includes(chatSearch.toLowerCase());
      const matchSubtitle = t.subtitle.toLowerCase().includes(chatSearch.toLowerCase());
      return matchName || matchLastMsg || matchSubtitle;
    });
  }, [threads, chatSearch]);

  const msgs = useMemo(() => {
    return comments.filter((c) => c.threadId === active);
  }, [comments, active]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [msgs, active]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function send() {
    const plain = body.replace(/<[^>]+>/g, "").trim();
    if (!plain && attachments.length === 0) return;

    let docIds: string[];
    try {
      docIds = await Promise.all(
        attachments.map(async (att) => {
          const rejection = checkNameAllowed(att.name, att.type);
          if (rejection) throw new Error(rejection.message);
          const doc = await uploadDocument({
            projectId: activeThread?.project?.id || projects[0]?.id || "",
            name: att.name,
            folder: "Attachments",
            size: formatBytes(att.size),
            shared: !internal,
          });
          return doc.id;
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
      return;
    }

    try {
      await createComment({
        threadId: active,
        author: currentUserId,
        body,
        visibility: internal ? "internal" : "client",
        attachments: docIds,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
      return;
    }

    setBody("");
    setAttachments([]);
    toast.success(internal ? "Internal note posted" : "Message sent");
  }

  if (!mounted) {
    return (
      <AppShell title="Messages" subtitle="Unified client-project message portal">
        <div className="panel overflow-hidden bg-card border-border/60 flex items-center justify-center h-[calc(100vh-13rem)] min-h-[700px] p-0 text-sm text-muted-foreground">
          Loading messages...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Messages" subtitle="Unified client-project message portal">
      <div className="panel overflow-hidden bg-card border-border/60 grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-13rem)] min-h-[700px] p-0">
        {/* Left sidebar: Conversations list */}
        <div className="border-r border-border md:col-span-1 flex flex-col h-full bg-muted/10">
          <div className="p-4 border-b border-border flex flex-col gap-3 bg-card/60">
            <h3 className="text-sm font-bold text-foreground tracking-tight select-none">Conversations</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search conversations..."
                className="h-8 w-full rounded-full border border-border bg-card pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">No conversations found</div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = active === t.id;
                const isProjectThread = t.type === "project";
                const chan = isProjectThread ? channels.find((c) => c.projectId === t.id) : null;
                const unreadCount = isProjectThread ? (chan ? chan.unread : 0) : (taskUnread[t.id] || 0);

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActive(t.id);
                      setAttachments([]);
                      if (isProjectThread) {
                        if (chan) markChannelAsRead(chan.id);
                      } else {
                        setTaskUnread((prev) => ({ ...prev, [t.id]: 0 }));
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold",
                      isSelected ? "bg-primary-foreground/25 text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {t.type === "project" ? (
                        <MessageCircle className="h-4.5 w-4.5" />
                      ) : t.type === "task" ? (
                        <ListTodo className="h-4.5 w-4.5" />
                      ) : (
                        <MessageSquare className="h-4.5 w-4.5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className={cn("text-xs font-bold truncate", isSelected ? "text-primary-foreground" : "text-foreground")}>
                          {t.name}
                        </div>
                        <span className="text-[10px] opacity-75 whitespace-nowrap">{t.lastAt}</span>
                      </div>
                      
                      <div className="text-[10px] opacity-90 font-medium truncate mt-0.5 flex items-center justify-between gap-1.5">
                        <span>{t.subtitle}</span>
                        {unreadCount > 0 && (
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap leading-none shrink-0",
                            isSelected ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                          )}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] opacity-75 font-normal truncate mt-0.5">
                        {t.lastMessage}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right view: Selected Conversation */}
        {activeThread ? (
          <div className="md:col-span-2 flex flex-col justify-between h-[calc(100vh-13rem)] min-h-[700px] bg-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-muted/5 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground truncate">
                    {activeThread.type === "project" 
                      ? `Project: ${activeThread.name} General` 
                      : activeThread.type === "task" 
                        ? `Task: ${activeThread.name}` 
                        : `Request: ${activeThread.name}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {activeThread.client && (
                    <Link
                      href={`/owner/clients?search=${encodeURIComponent(activeThread.client.name)}`}
                      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80 hover:text-foreground transition-all cursor-pointer"
                    >
                      Client: {activeThread.client.name}
                    </Link>
                  )}
                  {activeThread.project && (
                    <Link
                      href={`/owner/projects/view?projectId=${activeThread.project.id}`}
                      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 hover:bg-muted/80 hover:text-foreground transition-all cursor-pointer"
                    >
                      {activeThread.type === "project" ? "View project" : `Project: ${activeThread.project.name}`}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {activeThread.type === "task" && (() => {
                  const task = tasks.find((t) => t.id === activeThread.id);
                  if (!task) return null;
                  const meta = STAGE_META[task.stage || "todo"];
                  return (
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/10", meta.tone, meta.pill)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                      <button
                        onClick={() => setSelectedTaskId(activeThread.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Task
                      </button>
                    </div>
                  );
                })()}

                {activeThread.type === "request" && (() => {
                  const req = requests.find((r) => r.id === activeThread.id);
                  if (!req) return null;
                  const meta = REQUEST_STATUS_META[req.status || "submitted"];
                  return (
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/10", meta.cls)}>
                        {meta.label}
                      </span>
                      <button
                        onClick={() => open("request.review", { requestId: activeThread.id })}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Request
                      </button>
                    </div>
                  );
                })()}

                {activeThread.type === "project" && activeThread.project?.team && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">Active Members:</span>
                    <AvatarStack userIds={projectMemberIds(activeThread.project, tasks)} users={storeUsers} size={28} />
                  </div>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {msgs.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <span className="font-semibold">No messages yet</span>
                  <span className="text-xs text-muted-foreground/75 mt-0.5">Start the conversation by posting below.</span>
                </div>
              ) : (
                msgs.map((m) => {
                  const u = storeUsers.find((x) => x.id === m.author);
                  if (!u) return null;
                  const isInternal = m.visibility === "internal";
                  const isClient = u.role === "client";

                  return (
                    <div key={m.id} className="flex gap-3 text-sm group relative">
                      <UserAvatar user={u} size={32} className="shrink-0" />
                      
                      <div className={cn(
                        "flex-1 rounded-2xl px-4 py-3 border border-border/40 transition-all hover:border-border/80 relative",
                        isInternal 
                          ? "bg-amber-500/5 border-amber-500/20" 
                          : "bg-muted/40"
                      )}>
                        <div className="mb-1 flex items-center gap-2 text-xs">
                          <span className="font-bold text-foreground">{u.name}</span>
                          {isClient ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/45 px-2 py-0.25 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                              Client
                            </span>
                          ) : (
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.25 text-[9px] font-bold", (ROLE_BADGE[u.role] ?? ROLE_BADGE.team).cls)}>
                              {(ROLE_BADGE[u.role] ?? ROLE_BADGE.team).label}
                            </span>
                          )}
                          <span className="text-muted-foreground">{m.createdAt}</span>
                          {isInternal && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/45 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                              <Lock className="h-2.5 w-2.5" /> Internal only
                            </span>
                          )}
                        </div>

                        <div className="text-sm leading-relaxed text-foreground/90">
                          <FormattedBody html={m.body} />
                          <CommentAttachmentsList attachmentIds={m.attachments} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <div className="border-t border-border p-4 bg-muted/5 shrink-0">
              <RichEditor
                value={body}
                onChange={setBody}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                placeholder="Reply… use @ to mention, attach files"
                minHeight={90}
                onSend={send}
                sendDisabled={body.replace(/<[^>]+>/g, "").trim().length === 0 && attachments.length === 0}
                showInternalOnly
                isInternal={internal}
                onInternalChange={setInternal}
              />
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      <TaskDetailsDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        hideDiscussion
        authorId={currentUserId}
      />
    </AppShell>
  );
}

export default MessagesPage;
