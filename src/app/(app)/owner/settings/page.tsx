"use client";


import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Bell,
  Palette,
  Check,
  Copy,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Accessibility,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button as BaseButton } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useCurrentUser } from "@/lib/role-context";
import { AppDialog } from "@/components/ui/app-dialog";
import { TIMEZONE_OPTIONS, detectTimezone } from "@/lib/timezones";

function Button({ className, ...props }: React.ComponentProps<typeof BaseButton>) {
  return <BaseButton className={cn("rounded-full font-semibold", className)} {...props} />;
}

const SECTIONS = [
  { id: "profile", label: "My profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Role Access", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function SettingsPage() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section") as SectionId | null;

  const [active, setActive] = useState<SectionId>(() => {
    if (sectionParam && SECTIONS.some((s) => s.id === sectionParam)) {
      return sectionParam;
    }
    return "profile";
  });

  useEffect(() => {
    if (sectionParam && SECTIONS.some((s) => s.id === sectionParam)) {
      setActive(sectionParam);
    }
  }, [sectionParam]);

  return (
    <AppShell title="Settings" subtitle="Workspace, integrations and access">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="panel p-3 space-y-1 text-sm h-fit lg:sticky lg:top-6">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                active === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-6 min-w-0">
          {active === "profile" && <ProfileSection />}
          {active === "workspace" && <WorkspaceSection />}
          {active === "team" && <TeamSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "accessibility" && <AccessibilitySection />}
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Reusable atoms ---------- */

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function confirmDanger(message: string, onYes: () => void) {
  if (typeof window !== "undefined" && window.confirm(message)) onYes();
}

/* ---------- Workspace ---------- */

const DEFAULT_WORKSPACE = {
  name: "Carina Workspace",
  subdomain: "carina.clientplatform.app",
  currency: "USD",
  timezone: "Europe/Berlin",
  hours: "Mon–Fri · 9am–6pm CET",
};

function TimezoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hasMatch = TIMEZONE_OPTIONS.some((t) => t.tz === value);
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">Timezone</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {!hasMatch && <option value={value}>{value}</option>}
        {TIMEZONE_OPTIONS.map((t) => (
          <option key={t.tz} value={t.tz}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}

function WorkspaceSection() {
  const workspaceName = useStore((s) => s.workspaceName);
  const updateWorkspaceName = useStore((s) => s.updateWorkspaceName);

  const [form, setForm] = useState({
    name: workspaceName,
    subdomain: "carina.clientplatform.app",
    currency: "USD",
    timezone: "Europe/Berlin",
    hours: "Mon–Fri · 9am–6pm CET",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Default the timezone field to the device's actual timezone on first load.
  useEffect(() => {
    setForm((f) => ({ ...f, timezone: detectTimezone() }));
  }, []);

  const handleSave = () => {
    updateWorkspaceName(form.name);
    toast.success("Workspace settings saved");
  };

  return (
    <>
      <Section title="Workspace" description="Tune how the workspace appears to clients.">
        <div className="space-y-4">
          <Field label="Workspace name" value={form.name} onChange={set("name")} />
          <Field label="Subdomain" value={form.subdomain} onChange={set("subdomain")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default currency" value={form.currency} onChange={set("currency")} />
            <TimezoneField value={form.timezone} onChange={set("timezone")} />
          </div>
          <Field label="Working hours" value={form.hours} onChange={set("hours")} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setForm({ ...form, name: workspaceName }); toast("Changes discarded"); }}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Section>

      <Section title="Danger zone" description="Irreversible workspace actions.">
        <Row title="Transfer workspace" description="Move ownership to another admin.">
          <Button variant="outline" onClick={() => toast("Transfer flow opened")}>Transfer</Button>
        </Row>
        <Row title="Delete workspace" description="Permanently delete all data.">
          <Button variant="destructive" onClick={() => confirmDanger("Permanently delete this workspace? This cannot be undone.", () => toast.success("Workspace scheduled for deletion"))}>Delete</Button>
        </Row>
      </Section>
    </>
  );
}

/* ---------- Team & roles ---------- */

type Member = { name: string; email: string; role: string; status: string };

function TeamSection() {
  const [permissions, setPermissions] = useState([
    { perm: "Create & edit projects", roles: ["Owner", "Manager"] },
    { perm: "Manage billing", roles: ["Owner"] },
    { perm: "Invite team members", roles: ["Owner", "Manager"] },
    { perm: "View time reports", roles: ["Owner", "Manager"] },
  ]);
  const [editingPerm, setEditingPerm] = useState<{ perm: string; roles: string[] } | null>(null);

  return (
    <>
      <Section title="Role permissions" description="Configure what each role can access.">
        <div className="space-y-1">
          {permissions.map((p) => (
            <Row key={p.perm} title={p.perm} description={p.roles.join(", ")}>
              <Button variant="outline" size="sm" onClick={() => setEditingPerm({ perm: p.perm, roles: [...p.roles] })}>Edit</Button>
            </Row>
          ))}
        </div>
      </Section>

      {/* Edit Permission Dialog */}
      {editingPerm && (
        <AppDialog
          open
          onOpenChange={(open) => !open && setEditingPerm(null)}
          title={`Edit permission: ${editingPerm.perm}`}
          description="Configure which roles are granted this permission."
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPerm(null)}>Cancel</Button>
              <Button onClick={() => {
                setPermissions((perms) => perms.map((p) => p.perm === editingPerm.perm ? editingPerm : p));
                toast.success("Permissions updated");
                setEditingPerm(null);
              }}>Save changes</Button>
            </div>
          }
        >
          <div className="space-y-3 py-2">
            {["Owner", "Manager", "Member"].map((role) => {
              const checked = editingPerm.roles.includes(role);
              return (
                <label key={role} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const newRoles = e.target.checked
                        ? [...editingPerm.roles, role]
                        : editingPerm.roles.filter((r) => r !== role);
                      setEditingPerm({ ...editingPerm, roles: newRoles });
                    }}
                    className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/20 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{role}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </AppDialog>
      )}
    </>
  );
}

/* ---------- Notifications ---------- */

function NotificationToggle({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <Row title={title} description={desc}>
      <Switch
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          toast(`${title}: ${v ? "on" : "off"}`);
        }}
      />
    </Row>
  );
}

function NotificationsSection() {
  const groups: { title: string; items: [string, string, boolean][] }[] = [
    {
      title: "Email notifications",
      items: [
        ["New client request", "When a client submits a request", true],
        ["Comment mentions", "When a teammate @mentions you", true],
        ["Task assigned to me", "When someone assigns you a task", true],
        ["Weekly digest", "Summary of activity every Monday", false],
      ],
    },
    {
      title: "In-app notifications",
      items: [
        ["Project status changes", "Banner when project status changes", true],
        ["Time tracking reminders", "Reminder to log time at end of day", false],
        ["AI assistant suggestions", "Proactive suggestions from the assistant", true],
      ],
    },
    {
      title: "Client portal notifications",
      items: [
        ["Project milestone reached", "Notify client when milestones complete", true],
        ["Invoice issued", "Send notification when an invoice is issued", true],
      ],
    },
  ];
  return (
    <>
      {groups.map((g) => (
        <Section key={g.title} title={g.title}>
          <div className="space-y-1">
            {g.items.map(([t, d, on]) => (
              <NotificationToggle key={t} title={t} desc={d} defaultOn={on} />
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}

/* ---------- Integrations ---------- */

function IntegrationsSection() {
  const initial = [
    { name: "Slack", desc: "Post updates into channels", icon: Slack, connected: true },
    { name: "Google Calendar", desc: "Sync deadlines and meetings", icon: Calendar, connected: true },
    { name: "Gmail", desc: "Send client emails from the app", icon: Mail, connected: false },
    { name: "Figma", desc: "Embed designs into workspace and client portal", icon: Figma, connected: true },
    { name: "GitHub", desc: "Link commits to tasks", icon: Github, connected: false },
    { name: "Linear", desc: "Sync engineering tickets", icon: MessageSquare, connected: false },
  ];
  const [items, setItems] = useState(initial);

  const toggle = (name: string) => {
    setItems((arr) =>
      arr.map((i) => {
        if (i.name !== name) return i;
        const next = !i.connected;
        toast.success(next ? `${name} connected` : `${name} configuration opened`);
        return next === i.connected ? i : { ...i, connected: next };
      }),
    );
  };

  return (
    <Section title="Integrations" description="Connect Carina to the tools your team already uses.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.name} className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
              <i.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">{i.name}</div>
                {i.connected && <Badge variant="secondary" className="text-[10px]"><Check className="h-3 w-3 mr-0.5" />Connected</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{i.desc}</p>
              <div className="mt-3 flex gap-2">
                <Button variant={i.connected ? "outline" : "default"} size="sm" onClick={() => toggle(i.name)}>
                  {i.connected ? "Configure" : "Connect"}
                </Button>
                {i.connected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setItems((arr) => arr.map((x) => (x.name === i.name ? { ...x, connected: false } : x)));
                      toast.success(`${i.name} disconnected`);
                    }}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Branding ---------- */

const ACCENTS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444"];

function BrandingSection() {
  const [brand, setBrand] = useState({ name: "Carina Workspace", tagline: "Workspace for ambitious brands" });
  const [accent, setAccent] = useState(ACCENTS[0]);
  return (
    <>
      <Section title="Branding" description="Used across portal, magic-link emails and project reviews.">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">C</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Logo uploaded")}>Upload logo</Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Logo removed")}>Remove</Button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand name" value={brand.name} onChange={(v) => setBrand((b) => ({ ...b, name: v }))} />
          <Field label="Tagline" value={brand.tagline} onChange={(v) => setBrand((b) => ({ ...b, tagline: v }))} />
        </div>
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">Accent color</div>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => { setAccent(c); toast(`Accent set to ${c}`); }}
                className={`h-9 w-9 rounded-full border-2 transition-all ${accent === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ background: c }}
                aria-label={`Accent ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => toast("Changes discarded")}>Cancel</Button>
          <Button onClick={() => toast.success("Branding saved")}>Save changes</Button>
        </div>
      </Section>

      <Section title="Portal appearance">
        <div className="space-y-1">
          <NotificationToggle title="Show Carina logo in portal" desc="Display your logo in the client portal header" defaultOn />
          <NotificationToggle title="Custom login background" desc="Use a branded image on the login screen" defaultOn={false} />
          <NotificationToggle title="Dark mode for clients" desc="Allow clients to switch themes" defaultOn />
        </div>
      </Section>
    </>
  );
}

/* ---------- Magic link policy ---------- */

function MagicLinkSection() {
  const [exp, setExp] = useState("1 hour");
  const [session, setSession] = useState("7 days");
  const [domains, setDomains] = useState("client.com, partner.io");
  return (
    <>
      <Section title="Magic link policy" description="Control how clients sign in to the portal.">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Link expiration</div>
            <select
              value={exp}
              onChange={(e) => { setExp(e.target.value); toast(`Expiration: ${e.target.value}`); }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option>15 minutes</option>
              <option>1 hour</option>
              <option>24 hours</option>
              <option>7 days</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Session duration</div>
            <select
              value={session}
              onChange={(e) => { setSession(e.target.value); toast(`Session: ${e.target.value}`); }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option>1 day</option>
              <option>7 days</option>
              <option>30 days</option>
            </select>
          </div>
          <Field label="Allowed email domains" value={domains} onChange={setDomains} hint="Comma-separated. Leave empty to allow any domain." />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => toast.success("Policy saved")}>Save changes</Button>
        </div>
      </Section>

      <Section title="Security">
        <div className="space-y-1">
          <NotificationToggle title="Require 2FA for team members" desc="Force admin and member accounts to enable 2FA" defaultOn />
          <NotificationToggle title="One-time use links" desc="Magic links expire immediately after first use" defaultOn />
          <NotificationToggle title="IP allowlist" desc="Restrict portal access to specific IP addresses" defaultOn={false} />
          <NotificationToggle title="Audit log" desc="Track all sign-ins and sensitive actions" defaultOn />
        </div>
      </Section>
    </>
  );
}

/* ---------- API & webhooks ---------- */

type ApiKey = { name: string; key: string; created: string };
type Hook = { url: string; events: number; status: "Active" | "Paused" };

function ApiSection() {
  const [keys, setKeys] = useState<ApiKey[]>([
    { name: "Production", key: "carina_live_••••••••••••••8f2a", created: "Jan 14, 2026" },
    { name: "Zapier integration", key: "carina_live_••••••••••••••1d3b", created: "Mar 22, 2026" },
  ]);
  const [hooks, setHooks] = useState<Hook[]>([
    { url: "https://hooks.mglagency.com/projects", events: 4, status: "Active" },
    { url: "https://api.client.com/carina/webhook", events: 2, status: "Active" },
    { url: "https://staging.mglagency.com/test", events: 1, status: "Paused" },
  ]);

  const newKey = () => {
    const name = typeof window !== "undefined" ? window.prompt("Name for the API key") : null;
    if (!name) return;
    const suffix = Math.random().toString(16).slice(2, 6);
    setKeys((k) => [...k, { name, key: `carina_live_••••••••••••••${suffix}`, created: "Today" }]);
    toast.success(`API key "${name}" created`);
  };

  const copyKey = async (k: ApiKey) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(k.key);
      }
      toast.success("Key copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const removeKey = (name: string) => {
    confirmDanger(`Revoke API key "${name}"?`, () => {
      setKeys((arr) => arr.filter((x) => x.name !== name));
      toast.success("Key revoked");
    });
  };

  const addHook = () => {
    const url = typeof window !== "undefined" ? window.prompt("Endpoint URL") : null;
    if (!url) return;
    setHooks((h) => [...h, { url, events: 0, status: "Active" }]);
    toast.success("Webhook endpoint added");
  };

  const toggleHook = (url: string) => {
    setHooks((arr) =>
      arr.map((h) =>
        h.url === url ? { ...h, status: h.status === "Active" ? "Paused" : "Active" } : h,
      ),
    );
    toast("Webhook status updated");
  };

  return (
    <>
      <Section title="API keys" description="Use API keys to access the Carina REST API." action={<Button onClick={newKey}><Plus className="h-4 w-4 mr-1.5" />New key</Button>}>
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.name} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{k.name}</span>
                  <span className="text-xs text-muted-foreground">· Created {k.created}</span>
                </div>
                <code className="mt-1 block text-xs font-mono text-muted-foreground truncate">{k.key}</code>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyKey(k)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => removeKey(k.name)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Webhooks" description="Get notified when events happen in your workspace." action={<Button variant="outline" onClick={addHook}><Plus className="h-4 w-4 mr-1.5" />Add endpoint</Button>}>
        <div className="space-y-2">
          {hooks.map((w) => (
            <div key={w.url} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="flex-1 min-w-0">
                <code className="block text-xs font-mono truncate">{w.url}</code>
                <div className="mt-1 text-xs text-muted-foreground">{w.events} events</div>
              </div>
              <Badge variant={w.status === "Active" ? "default" : "secondary"}>{w.status}</Badge>
              <Button variant="ghost" size="sm" onClick={() => toggleHook(w.url)}>
                {w.status === "Active" ? "Pause" : "Resume"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast(`Editing ${w.url}`)}>Edit</Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Event types" description="Subscribe webhooks to any of these events.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-mono text-xs">
          {[
            "project.created", "project.updated", "project.archived",
            "task.created", "task.completed", "task.assigned",
            "request.submitted", "request.approved",
            "time.logged", "client.created",
          ].map((e) => (
            <button
              key={e}
              onClick={async () => {
                try {
                  if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(e);
                  toast.success(`Copied "${e}"`);
                } catch {
                  toast(e);
                }
              }}
              className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-left hover:bg-muted transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

function SettingsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}

export default SettingsPageWrapper;

/* ---------- My Profile ---------- */

function ProfileSection() {
  const user = useCurrentUser();
  const update = useStore((s) => s.updateTeamMember);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: user?.name ?? "Maya Larsson",
    email: user?.email ?? "maya@mglagency.com",
    title: user?.title ?? "Creative Director & Owner",
    phone: user?.phone ?? "+1 (555) 019-2834",
    language: "en-US",
  });

  const set = (k: keyof typeof profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const initials = profile.name.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = user?.avatar;
  const isImageAvatar = avatarUrl && (avatarUrl.startsWith("data:") || avatarUrl.includes("/") || avatarUrl.includes("."));

  const handleSave = () => {
    update(user.id, {
      name: profile.name,
      email: profile.email,
      title: profile.title,
      phone: profile.phone,
      // Keep the initials-based avatar (header, avatar stacks, etc.) in sync with
      // the name — but don't clobber an uploaded photo.
      ...(isImageAvatar ? {} : { avatar: initials || "?" }),
    });
    toast.success("Profile saved successfully");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      update(user.id, { avatar: dataUrl });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section title="My profile" description="Manage your personal profile details and contact information.">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            {isImageAvatar ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="h-16 w-16 object-cover rounded-full ring-2 ring-primary/20"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                {initials || "CR"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-semibold">
              Change
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">Profile photo</div>
            <p className="text-xs text-muted-foreground">PNG, JPG or GIF up to 5MB.</p>
            <div className="flex gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
              <Button variant="ghost" size="sm" onClick={() => { update(user.id, { avatar: initials }); toast.success("Photo removed"); }}>Remove</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value={profile.name} onChange={set("name")} />
            <Field label="Title" value={profile.title} onChange={set("title")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email address" type="email" value={profile.email} onChange={set("email")} />
            <Field label="Phone number" type="tel" value={profile.phone} onChange={set("phone")} />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Interface language</div>
            <select
              value={profile.language}
              onChange={(e) => { set("language")(e.target.value); toast(`Language set to ${e.target.value}`); }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="en-US">English (United States)</option>
              <option value="de-DE">Deutsch (German)</option>
              <option value="fr-FR">Français (French)</option>
              <option value="es-ES">Español (Spanish)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => {
            setProfile({
              name: user?.name ?? "",
              email: user?.email ?? "",
              title: user?.title ?? "",
              phone: user?.phone ?? "",
              language: "en-US",
            });
            toast("Changes discarded");
          }}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Section>

      <Section title="Security settings" description="Keep your personal workspace account secure.">
        <Row title="Change password" description="Update the password used to access your workspace.">
          <Button variant="outline" onClick={() => toast("Password reset flow initiated")}>Change password</Button>
        </Row>
        <Row title="Two-factor authentication (2FA)" description="Add an extra layer of security to your account.">
          <Button variant="outline" onClick={() => toast("2FA setup wizard opened")}>Enable 2FA</Button>
        </Row>
      </Section>
    </>
  );
}

/* ---------- Accessibility ---------- */

function AccessibilitySection() {
  const [contrast, setContrast] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-contrast") === "true";
    }
    return false;
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-reduce-motion") === "true";
    }
    return false;
  });
  const [screenReader, setScreenReader] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-screen-reader") === "true";
    }
    return false;
  });
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-keyboard-shortcuts") !== "false";
    }
    return true;
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-font-size") || "default";
    }
    return "default";
  });

  useEffect(() => {
    const el = document.documentElement;
    // Contrast
    if (contrast) {
      el.classList.add("high-contrast");
      let styleTag = document.getElementById("high-contrast-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "high-contrast-styles";
        styleTag.innerHTML = `
          .high-contrast {
            --border: #000000;
            --muted-foreground: #000000;
            contrast: 1.25;
            filter: contrast(1.15) saturate(1.1);
          }
          .dark .high-contrast {
            --border: #ffffff;
            --muted-foreground: #ffffff;
            filter: contrast(1.2) saturate(1.1);
          }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      el.classList.remove("high-contrast");
      document.getElementById("high-contrast-styles")?.remove();
    }
    localStorage.setItem("accessibility-contrast", String(contrast));
  }, [contrast]);

  useEffect(() => {
    const el = document.documentElement;
    // Reduce motion
    if (reduceMotion) {
      el.classList.add("reduce-motion");
      let styleTag = document.getElementById("reduce-motion-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "reduce-motion-styles";
        styleTag.innerHTML = `
          .reduce-motion *, .reduce-motion::before, .reduce-motion::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      el.classList.remove("reduce-motion");
      document.getElementById("reduce-motion-styles")?.remove();
    }
    localStorage.setItem("accessibility-reduce-motion", String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    const el = document.documentElement;
    // Font Scaling
    if (fontSize === "large") {
      el.style.fontSize = "16px";
    } else if (fontSize === "xlarge") {
      el.style.fontSize = "18px";
    } else {
      el.style.fontSize = "";
    }
    localStorage.setItem("accessibility-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("accessibility-screen-reader", String(screenReader));
  }, [screenReader]);

  useEffect(() => {
    localStorage.setItem("accessibility-keyboard-shortcuts", String(keyboardShortcuts));
  }, [keyboardShortcuts]);

  return (
    <>
      <Section title="Display accessibility" description="Customize visual options to improve visibility and focus.">
        <div className="space-y-4">
          <div className="space-y-1">
            <Row title="High contrast mode" description="Increase contrast across lines, badges, inputs and buttons for better readability.">
              <Switch
                checked={contrast}
                onCheckedChange={(v) => {
                  setContrast(v);
                  toast(`High contrast: ${v ? "Enabled" : "Disabled"}`);
                }}
              />
            </Row>
            <Row title="Reduce motion" description="Minimize animations, transitions, card scale-ups and layout sliding effects.">
              <Switch
                checked={reduceMotion}
                onCheckedChange={(v) => {
                  setReduceMotion(v);
                  toast(`Reduce motion: ${v ? "Enabled" : "Disabled"}`);
                }}
              />
            </Row>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Font scaling</div>
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                toast(`Font scale updated to ${e.target.value}`);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
            >
              <option value="default">Default (14px baseline)</option>
              <option value="large">Large (16px baseline)</option>
              <option value="xlarge">Extra Large (18px baseline)</option>
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">Adjust text baseline scaling universally across panels and inputs.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => toast.success("Accessibility settings saved")}>Save preferences</Button>
        </div>
      </Section>

      <Section title="Interaction & assistive technologies" description="Configure screen reader, shortcut maps, and focus behaviors.">
        <div className="space-y-1">
          <Row title="Keyboard shortcuts" description="Enable keyboard mappings to quickly trigger actions (e.g. 'p' for new project, 'c' for new client).">
            <Switch
              checked={keyboardShortcuts}
              onCheckedChange={(v) => {
                setKeyboardShortcuts(v);
                toast(`Keyboard shortcuts: ${v ? "Enabled" : "Disabled"}`);
              }}
            />
          </Row>
          <Row title="Optimize for screen readers" description="Enable explicit ARIA labelling and aria-live announcements for real-time background actions.">
            <Switch
              checked={screenReader}
              onCheckedChange={(v) => {
                setScreenReader(v);
                toast(`Screen reader optimization: ${v ? "Enabled" : "Disabled"}`);
              }}
            />
          </Row>
        </div>
      </Section>
    </>
  );
}
