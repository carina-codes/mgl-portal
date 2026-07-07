"use client";


import { PortalShell } from "@/components/portal-shell";
import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";

function PortalMessages() {
  const { client } = useActiveClient();
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const users = useStore((s) => s.users);
  const channel = channels.find((c) => c.clientId === client.id && c.projectId)!;
  const msgs = messages.filter((m) => m.channelId === channel.id && m.visibility === "client");
  return (
    <PortalShell title="Messages" subtitle={`Thread: ${channel.name}`}>
      <div className="panel overflow-hidden">
        <div className="max-h-[560px] space-y-4 overflow-y-auto p-6">
          {msgs.map((m) => {
            const u = users.find((x) => x.id === m.author)!;
            return (
              <div key={m.id} className="flex gap-3">
                <UserAvatar user={u} size={32} />
                <div className="flex-1 rounded-2xl bg-muted px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-semibold">{u.name}</span>
                    <span className="text-muted-foreground">{m.createdAt}</span>
                  </div>
                  <div className="text-sm">{m.body}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border p-4">
          <div className="rounded-2xl border border-border bg-background p-3">
            <textarea rows={2} placeholder="Message your team…" className="w-full resize-none bg-transparent text-sm focus:outline-none" />
            <div className="mt-2 flex items-center justify-end">
              <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Send</button>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

export default PortalMessages;
