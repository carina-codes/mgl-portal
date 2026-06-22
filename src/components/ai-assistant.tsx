"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Mic,
  History,
  MessageSquare,
  CheckCircle2,
  Plus,
  ArrowRightCircle,
  ListTodo,
  ClipboardList,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; body: string; ts: string };
type AIAction = { id: string; icon: typeof ListTodo; title: string; meta: string; ts: string };

const SUGGESTIONS = [
  "Summarize the NovaBoard project status",
  "Draft a response to Marcus' revision request",
  "Create three tasks for the Q3 campaign",
  "Generate a weekly status update for Lumen",
];

const SEED_MSGS: Msg[] = [
  {
    id: "m1",
    role: "assistant",
    body: "Hi Carina — I'm watching the **NovaBoard Mobile App** project. Want me to summarize this week's progress or draft an update for Marcus?",
    ts: "Just now",
  },
];

const SEED_ACTIONS: AIAction[] = [
  { id: "a1", icon: ListTodo, title: "Created task: Soften hero gradient", meta: "NovaBoard Mobile · assigned to Mia", ts: "12m ago" },
  { id: "a2", icon: ArrowRightCircle, title: "Moved 2 tasks to In Review", meta: "Auto-detected from comment thread", ts: "1h ago" },
  { id: "a3", icon: FileEdit, title: "Drafted client reply to Elena", meta: "Northwind Brand · awaiting your review", ts: "2h ago" },
  { id: "a4", icon: ClipboardList, title: "Summarized 4 requests from Lumen", meta: "Highlighted 1 needing clarification", ts: "Yesterday" },
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "actions">("chat");
  const [messages, setMessages] = useState<Msg[]>(SEED_MSGS);
  const [actions, setActions] = useState<AIAction[]>(SEED_ACTIONS);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function send(body: string) {
    if (!body.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", body, ts: "Now" };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    // Simulate streaming response
    const reply = composeReply(body);
    const id = crypto.randomUUID();
    let i = 0;
    setMessages((m) => [...m, { id, role: "assistant", body: "", ts: "Now" }]);
    const tick = () => {
      i += Math.max(2, Math.floor(reply.length / 60));
      setMessages((m) =>
        m.map((msg) => (msg.id === id ? { ...msg, body: reply.slice(0, i) } : msg)),
      );
      if (i < reply.length) {
        setTimeout(tick, 30);
      } else {
        setStreaming(false);
        // Log an action
        setActions((a) => [
          {
            id: crypto.randomUUID(),
            icon: FileEdit,
            title: "Generated response",
            meta: truncate(body, 48),
            ts: "Just now",
          },
          ...a,
        ]);
      }
    };
    setTimeout(tick, 250);
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 hidden",
          open && "rotate-90",
        )}
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex h-[640px] w-[420px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-br from-primary/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Carina Assistant</div>
              <div className="text-[11px] text-muted-foreground">Aware of NovaBoard Mobile</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-3 py-2">
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="Chat" />
          <TabBtn active={tab === "actions"} onClick={() => setTab("actions")} icon={History} label="Latest Actions" />
        </div>

        {tab === "chat" ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <div className="mr-2 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <Markdown body={m.body} />
                      {streaming && m.role === "assistant" && m === messages[messages.length - 1] && (
                        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
                      )}
                    </div>
                  </div>
                ))}
                {messages.length === 1 && (
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-2xl border border-dashed border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-background p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:border-primary">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask, draft, or take an action..."
                  className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Voice input"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                Responses are simulated for this prototype.
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Timeline of AI actions
            </div>
            <div className="space-y-3">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.id} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.meta}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Logged · {a.ts}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Markdown({ body }: { body: string }) {
  // Tiny markdown subset: **bold**, lists, paragraphs
  const lines = body.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.trim().startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span dangerouslySetInnerHTML={{ __html: bold(line.slice(2)) }} />
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: bold(line) }} />;
      })}
    </div>
  );
}
function bold(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function composeReply(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("status") || p.includes("summary") || p.includes("summarize"))
    return `Here's the **NovaBoard Mobile App** snapshot:\n- 64% complete, 312 of 480 estimated hours logged\n- 4 tasks in flight, 2 in review, 0 blocked\n- Latest update: Onboarding UI is in final review\n\nThe team is tracking ~5% above plan but well inside budget. Want me to draft a client update?`;
  if (p.includes("draft") || p.includes("reply") || p.includes("response"))
    return `Drafted reply to Marcus:\n\n> Hey Marcus — thanks for the feedback on the hero. We're softening the gradient and reducing the saturation by ~15%. We'll repost v3.1 today for your review. Let us know if anything else stands out.\n\nWant me to send it on your behalf or save as draft?`;
  if (p.includes("task") || p.includes("create"))
    return `Created 3 tasks under **Arcadia Q3 Campaign**:\n- Landing page wireframes — assigned to Ava\n- Paid creative concepts — assigned to Priya\n- Lifecycle email mapping — assigned to Carina\n\nAll set to **Medium** priority and due in 10 days. You'll see them in the Q3 Kanban.`;
  return `Got it. I'll handle that. (This is a simulated response — in production I'd reach into your projects, tasks, and conversations to act on it.)`;
}
