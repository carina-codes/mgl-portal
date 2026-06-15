"use client";


import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Plug,
  Palette,
  Link2,
  Webhook,
  Check,
  Copy,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Calendar,
  Github,
  Slack,
  Figma,
} from "lucide-react";



const SECTIONS = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Team & roles", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "magic", label: "Magic link policy", icon: Link2 },
  { id: "api", label: "API & webhooks", icon: Webhook },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function SettingsPage() {
  const [active, setActive] = useState<SectionId>("workspace");

  return (
    <AppShell title="Settings" subtitle="Workspace, billing, integrations and access">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="panel p-3 space-y-1 text-sm h-fit lg:sticky lg:top-6">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
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
          {active === "workspace" && <WorkspaceSection />}
          {active === "team" && <TeamSection />}
          {active === "billing" && <BillingSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "integrations" && <IntegrationsSection />}
          {active === "branding" && <BrandingSection />}
          {active === "magic" && <MagicLinkSection />}
          {active === "api" && <ApiSection />}
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
  name: "MGL Agency",
  subdomain: "mgl.clientplatform.app",
  currency: "USD",
  timezone: "Europe / Berlin",
  hours: "Mon–Fri · 9am–6pm CET",
};

function WorkspaceSection() {
  const [form, setForm] = useState(DEFAULT_WORKSPACE);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Section title="Workspace" description="Tune how the studio appears to clients.">
        <div className="space-y-4">
          <Field label="Workspace name" value={form.name} onChange={set("name")} />
          <Field label="Subdomain" value={form.subdomain} onChange={set("subdomain")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default currency" value={form.currency} onChange={set("currency")} />
            <Field label="Timezone" value={form.timezone} onChange={set("timezone")} />
          </div>
          <Field label="Working hours" value={form.hours} onChange={set("hours")} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setForm(DEFAULT_WORKSPACE); toast("Changes discarded"); }}>Cancel</Button>
          <Button onClick={() => toast.success("Workspace settings saved")}>Save changes</Button>
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

const INITIAL_TEAM: Member[] = [
  { name: "Maya Larsson", email: "maya@mgl.studio", role: "Owner", status: "Active" },
  { name: "Jonas Weber", email: "jonas@mgl.studio", role: "Admin", status: "Active" },
  { name: "Priya Shah", email: "priya@mgl.studio", role: "Member", status: "Active" },
  { name: "Alex Chen", email: "alex@mgl.studio", role: "Member", status: "Invited" },
];

function TeamSection() {
  const [team, setTeam] = useState<Member[]>(INITIAL_TEAM);

  const invite = () => {
    const email = typeof window !== "undefined" ? window.prompt("Email to invite") : null;
    if (!email) return;
    setTeam((t) => [...t, { name: email.split("@")[0], email, role: "Member", status: "Invited" }]);
    toast.success(`Invitation sent to ${email}`);
  };

  const updateRole = (email: string, role: string) => {
    setTeam((t) => t.map((m) => (m.email === email ? { ...m, role } : m)));
    toast.success(`Role updated to ${role}`);
  };

  const remove = (email: string) => {
    confirmDanger(`Remove ${email} from the workspace?`, () => {
      setTeam((t) => t.filter((m) => m.email !== email));
      toast.success("Member removed");
    });
  };

  return (
    <>
      <Section title="Team & roles" description="Manage who has access and what they can do." action={<Button onClick={invite}><Plus className="h-4 w-4 mr-1.5" />Invite</Button>}>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Member</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.email} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.email, e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option>Owner</option>
                      <option>Admin</option>
                      <option>Member</option>
                      <option>Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status === "Active" ? "default" : "secondary"}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(m.email)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Role permissions" description="Configure what each role can access.">
        <div className="space-y-1">
          {[
            { perm: "Create & edit projects", roles: "Owner, Admin" },
            { perm: "Manage billing", roles: "Owner" },
            { perm: "Invite team members", roles: "Owner, Admin" },
            { perm: "Approve deliverables", roles: "Owner, Admin, Member" },
            { perm: "View time reports", roles: "Owner, Admin" },
          ].map((p) => (
            <Row key={p.perm} title={p.perm} description={p.roles}>
              <Button variant="outline" size="sm" onClick={() => toast(`Editing: ${p.perm}`)}>Edit</Button>
            </Row>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ---------- Billing ---------- */

function BillingSection() {
  return (
    <>
      <Section title="Current plan" description="You're on the Studio plan.">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">Studio</span>
                <Badge>Current</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Unlimited projects · 25 team seats · Client portal</p>
              <div className="mt-3 text-2xl font-bold">$149<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => toast.success("Upgrade flow opened")}>Upgrade</Button>
              <Button variant="ghost" size="sm" onClick={() => toast("Plan comparison opened")}>Change plan</Button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground">Seats used</div>
            <div className="mt-1 font-semibold">12 / 25</div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground">Storage</div>
            <div className="mt-1 font-semibold">42 GB / 500 GB</div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground">Next invoice</div>
            <div className="mt-1 font-semibold">Jul 1, 2026</div>
          </div>
        </div>
      </Section>

      <Section title="Payment method" action={<Button variant="outline" onClick={() => toast("Card update form opened")}>Update</Button>}>
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <div className="grid h-10 w-14 place-items-center rounded-md bg-foreground text-background text-xs font-bold">VISA</div>
          <div className="flex-1">
            <div className="text-sm font-medium">•••• •••• •••• 4242</div>
            <div className="text-xs text-muted-foreground">Expires 09/27 · Maya Larsson</div>
          </div>
        </div>
      </Section>

      <Section title="Invoices">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Jun 1, 2026", amount: "$149.00", status: "Paid" },
                { date: "May 1, 2026", amount: "$149.00", status: "Paid" },
                { date: "Apr 1, 2026", amount: "$149.00", status: "Paid" },
              ].map((inv) => (
                <tr key={inv.date} className="border-t border-border">
                  <td className="px-4 py-3">{inv.date}</td>
                  <td className="px-4 py-3 font-medium">{inv.amount}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => toast.success(`Invoice ${inv.date} downloaded`)}>Download</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
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
        ["Deliverable approved", "When a client approves a deliverable", true],
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
        ["New deliverable ready", "Notify client when a deliverable is shared", true],
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
    { name: "Figma", desc: "Embed designs into deliverables", icon: Figma, connected: true },
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
    <Section title="Integrations" description="Connect MGL to the tools your team already uses.">
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
  const [brand, setBrand] = useState({ name: "MGL Agency", tagline: "Studio for ambitious brands" });
  const [accent, setAccent] = useState(ACCENTS[0]);
  return (
    <>
      <Section title="Branding" description="Used across portal, magic-link emails and deliverable reviews.">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">M</div>
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
          <NotificationToggle title="Show MGL logo in portal" desc="Display your logo in the client portal header" defaultOn />
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
    { name: "Production", key: "mgl_live_••••••••••••••8f2a", created: "Jan 14, 2026" },
    { name: "Zapier integration", key: "mgl_live_••••••••••••••1d3b", created: "Mar 22, 2026" },
  ]);
  const [hooks, setHooks] = useState<Hook[]>([
    { url: "https://hooks.mgl.studio/projects", events: 4, status: "Active" },
    { url: "https://api.client.com/mgl/webhook", events: 2, status: "Active" },
    { url: "https://staging.mgl.studio/test", events: 1, status: "Paused" },
  ]);

  const newKey = () => {
    const name = typeof window !== "undefined" ? window.prompt("Name for the API key") : null;
    if (!name) return;
    const suffix = Math.random().toString(16).slice(2, 6);
    setKeys((k) => [...k, { name, key: `mgl_live_••••••••••••••${suffix}`, created: "Today" }]);
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
      <Section title="API keys" description="Use API keys to access the MGL REST API." action={<Button onClick={newKey}><Plus className="h-4 w-4 mr-1.5" />New key</Button>}>
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
            "deliverable.shared", "deliverable.approved",
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

export default SettingsPage;
