import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/user-avatar";
import { channels, messages, users } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/app/messages")({ component: MessagesPage });

function MessagesPage() {
  const [active, setActive] = useState(channels[0].id);
  const msgs = messages.filter((m) => m.channelId === active);
  const channel = channels.find((c) => c.id === active)!;

  return (
    <AppShell title="Messages" subtitle="Threaded conversations across projects and clients">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="panel p-3">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
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
          <div className="max-h-[520px] space-y-4 overflow-y-auto p-6">
            {msgs.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No messages yet</div>
            ) : msgs.map((m) => {
              const u = users.find((x) => x.id === m.author)!;
              const internal = m.visibility === "internal";
              return (
                <div key={m.id} className="flex gap-3">
                  <UserAvatar user={u} size={32} />
                  <div className={cn("flex-1 rounded-2xl px-4 py-3", internal ? "bg-amber-50 border border-amber-200/60" : "bg-muted")}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-muted-foreground">{m.createdAt}</span>
                      {internal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          <Lock className="h-2.5 w-2.5" /> Internal
                        </span>
                      )}
                    </div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border p-4">
            <div className="rounded-2xl border border-border bg-background p-3">
              <textarea rows={2} placeholder="Reply…" className="w-full resize-none bg-transparent text-sm focus:outline-none" />
              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--color-primary)]" /> Internal only
                </label>
                <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
