import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Workspace, billing, integrations and access">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="panel p-3 space-y-1 text-sm">
          {["Workspace", "Team & roles", "Billing", "Notifications", "Integrations", "Branding", "Magic link policy", "API & webhooks"].map((s, i) => (
            <button key={s} className={`block w-full rounded-xl px-3 py-2 text-left ${i === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </nav>
        <div className="space-y-6">
          <div className="panel p-6">
            <h3 className="text-lg font-semibold">Workspace</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tune how the studio appears to clients.</p>
            <div className="mt-5 space-y-4">
              <Field label="Workspace name" value="MGL Agency" />
              <Field label="Subdomain" value="mgl.clientplatform.app" />
              <Field label="Default currency" value="USD" />
              <Field label="Working hours" value="Mon–Fri · 9am–6pm CET" />
            </div>
          </div>
          <div className="panel p-6">
            <h3 className="text-lg font-semibold">Branding</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">M</div>
              <div className="text-sm text-muted-foreground">Used across portal, magic-link emails and deliverable reviews.</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <input defaultValue={value} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </div>
  );
}
