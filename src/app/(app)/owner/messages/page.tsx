"use client";

import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { messages as seedMessages, users } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

function MessagesPage() {
  const channels = useStore((s) => s.channels);
  const markChannelAsRead = useStore((s) => s.markChannelAsRead);
  
  const [active, setActive] = useState(channels[0]?.id || "ch1");
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const [msgList, setMsgList] = useState<any[]>(seedMessages);

  const uploadDocument = useStore((s) => s.uploadDocument);

  // Automatically mark initial active channel as read
  useEffect(() => {
    if (active) {
      markChannelAsRead(active);
    }
  }, [active, markChannelAsRead]);

  const msgs = msgList.filter((m) => m.channelId === active);
  const channel = channels.find((c) => c.id === active) || channels[0];
  const projectId = channel.projectId || "p1";

  function send() {
    const plain = body.replace(/<[^>]+>/g, "").trim();
    if (!plain && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: !internal,
      });
      return doc.id;
    });

    const newMsg = {
      id: `m-${Date.now()}`,
      channelId: active,
      author: "u1",
      body,
      createdAt: "Just now",
      visibility: internal ? ("internal" as const) : ("all" as const),
      attachments: docIds,
    };
    setMsgList((l) => [...l, newMsg]);
    setBody("");
    setAttachments([]);
    toast.success(internal ? "Internal note posted" : "Message sent");
  }

  return (
    <AppShell title="Messages" subtitle="Threaded conversations across projects and clients">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="panel p-3">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActive(c.id);
                setAttachments([]);
              }}
              className={cn(
                "block w-full rounded-2xl px-3 py-2.5 text-left transition-colors",
                active === c.id ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium">{c.name}</div>
                {c.unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{c.unread}</span>
                )}
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastMessage}</div>
              <div className="text-[10px] text-muted-foreground">{c.lastAt}</div>
            </button>
          ))}
        </div>
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <div className="text-sm font-semibold">#{channel.name}</div>
          </div>
          <div className="max-h-[520px] space-y-4 overflow-y-auto p-6 scrollbar-thin">
            {msgs.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No messages yet</div>
            ) : msgs.map((m) => {
              const u = users.find((x) => x.id === m.author)!;
              const isInternal = m.visibility === "internal";
              return (
                <div key={m.id} className="flex gap-3">
                  <UserAvatar user={u} size={32} />
                  <div className={cn("flex-1 rounded-2xl px-4 py-3 border border-border/40", isInternal ? "border-amber-200/60 bg-amber-500/10" : "bg-muted/40")}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-muted-foreground">{m.createdAt}</span>
                      {isInternal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/45 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          <Lock className="h-2.5 w-2.5" /> Internal
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground/90">
                      <FormattedBody html={m.body} />
                      <CommentAttachmentsList attachmentIds={m.attachments} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border p-4">
            <RichEditor
              value={body}
              onChange={setBody}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              placeholder="Reply… use @ to mention, attach files, drop in emoji"
              minHeight={90}
              onSend={send}
              sendDisabled={body.replace(/<[^>]+>/g, "").trim().length === 0 && attachments.length === 0}
              showInternalOnly
              isInternal={internal}
              onInternalChange={setInternal}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default MessagesPage;
