/**
 * Modals — central modal system for the Carina Client Platform.
 *
 * Every workflow modal in the app is registered here. Trigger any modal
 * from anywhere via the `useModals()` hook, e.g.:
 *
 *   const { open } = useModals();
 *   open("project.new");
 *   open("task.edit", { taskId });
 *
 * The <ModalsHost /> component is mounted once in the root and renders
 * whichever modal is currently active.
 */
import { create } from "zustand";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  AppDialog,
  FieldGroup,
  FieldLabel,
  TextField,
  SelectField,
} from "@/components/ui/app-dialog";
import { cn } from "@/lib/utils";
import { RichEditor } from "@/components/rich-editor";
import { useStore } from "@/lib/store";
import {
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  REQUEST_TYPE_META,
  type ProjectStatus,
  type TaskStage,
  type Priority,
  type RequestType,
  type RequestStatus,
  type Project,
  type ProjectShareLink,
} from "@/lib/mock-data";
import {
  Briefcase,
  FolderPlus,
  Archive,
  Users,
  UserPlus,
  UserCog,
  Trash2,
  ListTodo,
  ListChecks,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  PackageCheck,
  RefreshCw,
  Upload,
  FilePlus2,
  FolderPlus as FolderPlusIcon,
  Folder,
  Move,
  Clock,
  Sparkles,
  Flag,
  CircleDot,
  AlertTriangle,
  Cloud,
  FolderOpen,
  HardDrive,
  FileText,
  Share2,
  Link2,
  Copy,
  Shield,
  Eye,
  Globe,
  Lock,
  Check,
  Settings,
  Edit2,
  MoreHorizontal,
  TrendingUp,
  CircleUser,
  ExternalLink,
  ChevronDown,
  Calendar,
  Power,
} from "lucide-react";
import { UserAvatar, AvatarStack } from "@/components/user-avatar";
import { Switch } from "@/components/ui/switch";

/* ─────────────────────────── Registry types ─────────────────────────── */

export type ModalKey =
  // Projects
  | "project.new"
  | "project.edit"
  | "project.share"
  | "project.settings"
  | "project.archive"
  | "project.status"
  | "project.delete"
  // Clients
  | "client.new"
  | "client.edit"
  | "client.archive"
  | "client.delete"
  | "client.status"
  | "client.share"
  | "client.invite"
  | "client.settings"
  // Tasks
  | "task.new"
  | "task.edit"
  | "task.delete"
  | "task.assign"
  | "task.status"
  | "task.priority"
  // Requests
  | "request.new"
  | "request.review"
  | "request.approve"
  | "request.reject"
  | "request.convertTask"
  | "request.convertProject"

  // Documents
  | "doc.upload"
  | "doc.folder.new"
  | "doc.folder.rename"
  | "doc.folder.delete"
  | "doc.rename"
  | "doc.move"
  | "doc.delete"
  | "project.storage.connect"
  // Team
  | "team.add"
  | "team.edit"
  | "team.remove"
  // Time
  | "time.log"
  | "time.edit"
  | "time.delete"
  // AI
  | "ai.review"
  | "ai.confirm";

export type ModalPayload = Record<string, unknown> | undefined;

type ModalState = {
  active: { key: ModalKey; payload?: ModalPayload } | null;
  open: (key: ModalKey, payload?: ModalPayload) => void;
  close: () => void;
};

export const useModals = create<ModalState>((set) => ({
  active: null,
  open: (key, payload) => set({ active: { key, payload } }),
  close: () => set({ active: null }),
}));

/* ─────────────────────────── Common bits ─────────────────────────── */

function PrimaryButton({
  loading,
  children,
  ...rest
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
      )}
      {children}
    </button>
  );
}

function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
    />
  );
}

function DangerButton({
  loading,
  children,
  ...rest
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
      )}
      {children}
    </button>
  );
}

/** Small simulated async runner so every form has a believable loading + success arc. */
function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  async function run<T>(fn: () => T | Promise<T>, success?: string): Promise<T> {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 420 + Math.random() * 240));
      const out = await fn();
      if (success) toast.success(success);
      return out;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

/* ─────────────────────────── Host ─────────────────────────── */

export function ModalsHost() {
  const { active, close } = useModals();
  if (!active) return null;
  const Component = REGISTRY[active.key];
  if (!Component) return null;
  return <Component payload={active.payload} close={close} />;
}

/* ─────────────────────────── Modals: Projects ─────────────────────────── */

function NewProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const createProject = useStore((s) => s.createProject);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    name: "",
    clientId: (payload?.clientId as string) ?? clients[0]?.id ?? "",
    description: "",
    type: "fixed" as "fixed" | "hourly" | "retainer",
    status: "planning" as ProjectStatus,
    budget: 25000,
    hoursEstimate: 120,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    team: [] as string[],
    lead: "",
  });
  const valid = form.name.trim().length > 1 && !!form.clientId;

  async function submit() {
    if (!valid) return toast.error("Add a project name and pick a client.");
    await run(
      () => createProject({ ...form, lead: form.lead || form.team[0] }),
      "Project created",
    );
    close();
  }

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="New project"
      description="Spin up a new engagement with a client, budget and timeline."
      icon={<Briefcase className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} loading={busy} disabled={!valid}>
            Create project
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup className="space-y-6">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <TextField
            label="Project name"
            placeholder="e.g. NovaBoard Mobile App"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Client"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField
              label="Engagement type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "hourly" | "retainer" })}
            >
              <option value="fixed">Fixed bid</option>
              <option value="hourly">Hourly rate</option>
              <option value="retainer">Monthly retainer</option>
            </SelectField>
          </div>
        </div>

        {/* Section 2: Parameters (Timeline & Budget) - Styled Container */}
        <div className="rounded-3xl border border-border/60 bg-muted/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>Timeline & Budget Settings</span>
          </div>
          
          {(() => {
            const budgetLabel = {
              fixed: "Budget (USD)",
              hourly: "Hourly rate (USD)",
              retainer: "Monthly retainer (USD)",
            }[form.type] ?? "Budget (USD)";

            const hoursLabel = {
              fixed: "Hours estimate",
              hourly: "Estimated hours",
              retainer: "Allocated hours",
            }[form.type] ?? "Hours estimate";

            return (
              <div className="grid grid-cols-3 gap-4">
                <TextField
                  label={budgetLabel}
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                />
                <TextField
                  label={hoursLabel}
                  type="number"
                  value={form.hoursEstimate}
                  onChange={(e) => setForm({ ...form, hoursEstimate: Number(e.target.value) })}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                >
                  {Object.entries(PROJECT_STATUS_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </SelectField>
              </div>
            );
          })()}
          
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <TextField
              label="Target launch"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Section 3: Staffing */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>Team Staffing</span>
          </div>
          <MultiUserPicker
            users={team}
            selected={form.team}
            onChange={(team) => setForm({ ...form, team })}
          />
        </div>

        {/* Section 4: Brief */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Project Brief & Scope</span>
          </div>
          <RichEditor
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
            placeholder="Goals, scope, success metrics…"
            minHeight={120}
          />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function EditProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const clients = useStore((s) => s.clients);
  const teamUsers = useStore((s) => s.users).filter((u) => u.role !== "client");
  const updateProject = useStore((s) => s.updateProject);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    name: project?.name ?? "",
    clientId: project?.clientId ?? "",
    type: project?.type ?? "fixed",
    description: project?.description ?? "",
    budget: project?.budget ?? 0,
    hoursEstimate: project?.hoursEstimate ?? 0,
    endDate: project?.endDate ?? "",
    team: project?.team ?? [],
  }));
  if (!project) return null;

  const budgetLabel = {
    fixed: "Budget (USD)",
    hourly: "Hourly rate (USD)",
    retainer: "Monthly retainer (USD)",
  }[form.type] ?? "Budget (USD)";

  const hoursLabel = {
    fixed: "Hours estimate",
    hourly: "Estimated hours",
    retainer: "Allocated hours",
  }[form.type] ?? "Hours estimate";

  async function submit() {
    await run(() => updateProject(projectId, form), "Project updated");
    close();
  }

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit project"
      description="Update scope, budget and timeline."
      icon={<Briefcase className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} loading={busy}>Save changes</PrimaryButton>
        </div>
      }
    >
      <FieldGroup className="space-y-6">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <TextField label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <SelectField
              label="Engagement type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "hourly" | "retainer" })}
            >
              <option value="fixed">Fixed bid</option>
              <option value="hourly">Hourly rate</option>
              <option value="retainer">Monthly retainer</option>
            </SelectField>
          </div>
        </div>

        {/* Section 2: Parameters (Timeline & Budget) */}
        <div className="rounded-3xl border border-border/60 bg-muted/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>Timeline & Budget Settings</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TextField label={budgetLabel} type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            <TextField label={hoursLabel} type="number" value={form.hoursEstimate} onChange={(e) => setForm({ ...form, hoursEstimate: Number(e.target.value) })} />
            <TextField label="Target launch" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>

        {/* Section 3: Staffing */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>Team Staffing</span>
          </div>
          <MultiUserPicker
            users={teamUsers}
            selected={form.team}
            onChange={(team) => setForm({ ...form, team })}
          />
        </div>

        {/* Section 4: Brief */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Project Brief & Scope</span>
          </div>
          <RichEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} minHeight={140} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ArchiveProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const archive = useStore((s) => s.archiveProject);
  const { busy, run } = useAsyncAction();
  if (!project) return null;
  return (
    <ConfirmDialog
      title="Archive this project?"
      description={`${project.name} will be moved to On hold. You can restore it later from project settings.`}
      icon={<Archive className="h-5 w-5" />}
      confirmLabel="Archive project"
      destructive
      busy={busy}
      onConfirm={async () => {
        await run(() => archive(projectId), `${project.name} archived`);
        close();
      }}
      onCancel={close}
    />
  );
}

function DeleteProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const deleteProject = useStore((s) => s.deleteProject);
  const { busy, run } = useAsyncAction();
  if (!project) return null;
  return (
    <ConfirmDialog
      title="Delete this project?"
      description={`Are you sure you want to delete ${project.name}? This action is permanent and cannot be undone.`}
      icon={<Trash2 className="h-5 w-5" />}
      confirmLabel="Delete project"
      destructive
      busy={busy}
      onConfirm={async () => {
        await run(() => deleteProject(projectId), `${project.name} deleted`);
        close();
      }}
      onCancel={close}
    />
  );
}

function ProjectStatusModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const setStatus = useStore((s) => s.setProjectStatus);
  const [status, setS] = useState<ProjectStatus>(project?.status ?? "planning");
  const { busy, run } = useAsyncAction();
  if (!project) return null;

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Change project status"
      description="Update the lifecycle stage to keep stakeholders in sync."
      icon={<Flag className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => setStatus(projectId, status), "Status updated");
              close();
            }}
          >
            Apply
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map((s) => {
          const m = PROJECT_STATUS_META[s];
          const active = s === status;
          return (
            <button
              key={s}
              onClick={() => setS(s)}
              className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-colors ${
                active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">{m.label}</span>
              {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}

/* ─────────────────────────── Modals: Clients ─────────────────────────── */

function NewClientModal({ close }: { close: () => void; payload?: ModalPayload }) {
  const create = useStore((s) => s.createClient);
  const { busy, run } = useAsyncAction();
  const [section, setSection] = useState<"company" | "contact" | "location" | "socials">("company");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    logoColor: "#0049FE",
    contact: "",
    contactEmail: "",
    contactPhone: "",
    contactRole: "",
    preferredContactMethod: "email" as "email" | "phone" | "messages",
    website: "",
    phone: "",
    description: "",
    country: "United States",
    state: "",
    city: "",
    timezone: "America/New_York",
    address: "",
    mapDirectionsLink: "",
    workingHours: "9:00 AM - 5:00 PM EST",
    availabilityNotes: "",
    notes: "",
    internalNotes: "",
    tagsString: "",
    linkedin: "",
    instagram: "",
    twitter: "",
  });
  
  const valid = form.name && form.contactEmail.includes("@");

  const handleSubmit = async () => {
    const tags = form.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const socialLinks = {
      linkedin: form.linkedin,
      instagram: form.instagram,
      twitter: form.twitter,
    };
    
    await run(() => create({
      ...form,
      tags,
      socialLinks,
    }), "Client added");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="New client"
      description="Add a client workspace with rich profile attributes."
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground">
            * Company Name and Contact Email are required.
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton
              loading={busy}
              disabled={!valid}
              onClick={handleSubmit}
            >
              Add client
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="flex border-b border-border/60 pb-2 mb-4 gap-1">
        {(["company", "contact", "location", "socials"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer",
              section === s
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s === "company" ? "Company Info" : s === "location" ? "Location & Availability" : s === "socials" ? "Socials & Notes" : "Primary Contact"}
          </button>
        ))}
      </div>

      <FieldGroup>
        {section === "company" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              <TextField label="Industry" placeholder="SaaS · DTC · Brand" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Website URL" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <TextField label="Main Phone" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Brand Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="h-11 w-12 cursor-pointer rounded-2xl border border-border bg-background"
                  />
                  <input
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm uppercase"
                  />
                </div>
              </div>
              <TextField label="Tags (comma-separated)" placeholder="Enterprise, Retail, High-Priority" value={form.tagsString} onChange={(e) => setForm({ ...form, tagsString: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Company Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Core business, client biography..."
                className="h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        )}

        {section === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Primary Contact Name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              <TextField label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Contact Phone" placeholder="+1 (555) 012-3457" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              <TextField label="Contact Role/Title" placeholder="CMO / VP Marketing" value={form.contactRole} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Preferred Contact Method" value={form.preferredContactMethod} onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value as any })}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="messages">Portal Messages</option>
              </SelectField>
            </div>
          </div>
        )}

        {section === "location" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State / Region" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Time Zone" placeholder="America/New_York" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              <TextField label="Working Hours" placeholder="9:00 AM - 5:00 PM EST" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Business Address" placeholder="e.g. 100 Broadway, 24th Floor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <TextField label="Map Directions Link" placeholder="https://maps.google.com/..." value={form.mapDirectionsLink} onChange={(e) => setForm({ ...form, mapDirectionsLink: e.target.value })} />
            </div>
            <div>
              <TextField label="Availability Notes" placeholder="e.g. Out of office on Fridays" value={form.availabilityNotes} onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })} />
            </div>
          </div>
        )}

        {section === "socials" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <TextField label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              <TextField label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              <TextField label="Twitter / X URL" placeholder="https://x.com/..." value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Rich Text Notes (Client Overview)</FieldLabel>
              <RichEditor value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} minHeight={120} />
            </div>
            <div>
              <FieldLabel>Internal Notes (Visible only to team)</FieldLabel>
              <textarea
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                placeholder="Important account secrets, negotiation margins..."
                className="h-16 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        )}
      </FieldGroup>
    </AppDialog>
  );
}

function EditClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const update = useStore((s) => s.updateClient);
  const { busy, run } = useAsyncAction();
  const [section, setSection] = useState<"company" | "contact" | "location" | "socials">("company");
  
  const [form, setForm] = useState(() => ({
    name: client?.name ?? "",
    industry: client?.industry ?? "",
    logoColor: client?.logoColor ?? "#0049FE",
    contact: client?.contact ?? "",
    contactEmail: client?.contactEmail ?? "",
    contactPhone: client?.contactPhone ?? "",
    contactRole: client?.contactRole ?? "",
    preferredContactMethod: client?.preferredContactMethod ?? "email",
    website: client?.website ?? "",
    phone: client?.phone ?? "",
    description: client?.description ?? "",
    country: client?.country ?? "United States",
    state: client?.state ?? "",
    city: client?.city ?? "",
    timezone: client?.timezone ?? "America/New_York",
    address: client?.address ?? "",
    mapDirectionsLink: client?.mapDirectionsLink ?? "",
    workingHours: client?.workingHours ?? "9:00 AM - 5:00 PM EST",
    availabilityNotes: client?.availabilityNotes ?? "",
    notes: client?.notes ?? "",
    internalNotes: client?.internalNotes ?? "",
    tagsString: client?.tags?.join(", ") ?? "",
    linkedin: client?.socialLinks?.linkedin ?? "",
    instagram: client?.socialLinks?.instagram ?? "",
    twitter: client?.socialLinks?.twitter ?? "",
    status: client?.status ?? "active",
    health: client?.health ?? "healthy",
    retainer: client?.retainer ?? "Project",
  }));

  if (!client) return null;

  const handleSubmit = async () => {
    const tags = form.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const socialLinks = {
      linkedin: form.linkedin,
      instagram: form.instagram,
      twitter: form.twitter,
    };
    
    await run(() => update(id, {
      ...form,
      tags,
      socialLinks,
    }), "Client updated");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit client"
      description="Update client workspace profile attributes."
      icon={<UserCog className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Changes apply to client: <span className="font-semibold text-foreground">{client.name}</span>
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton
              loading={busy}
              onClick={handleSubmit}
            >
              Save changes
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="flex border-b border-border/60 pb-2 mb-4 gap-1">
        {(["company", "contact", "location", "socials"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer",
              section === s
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s === "company" ? "Company Info" : s === "location" ? "Location & Availability" : s === "socials" ? "Socials & Notes" : "Primary Contact"}
          </button>
        ))}
      </div>

      <FieldGroup>
        {section === "company" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Industry" placeholder="SaaS · DTC · Brand" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Website URL" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <TextField label="Main Phone" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </SelectField>
              <SelectField label="Health" value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value as any })}>
                <option value="healthy">Healthy</option>
                <option value="watch">Watch</option>
                <option value="at-risk">At Risk</option>
              </SelectField>
              <TextField label="Retainer" value={form.retainer} onChange={(e) => setForm({ ...form, retainer: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Brand Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="h-11 w-12 cursor-pointer rounded-2xl border border-border bg-background"
                  />
                  <input
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm uppercase"
                  />
                </div>
              </div>
              <TextField label="Tags (comma-separated)" placeholder="Enterprise, Retail, High-Priority" value={form.tagsString} onChange={(e) => setForm({ ...form, tagsString: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Company Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Core business, client biography..."
                className="h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        )}

        {section === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Primary Contact Name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              <TextField label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Contact Phone" placeholder="+1 (555) 012-3457" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              <TextField label="Contact Role/Title" placeholder="CMO / VP Marketing" value={form.contactRole} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Preferred Contact Method" value={form.preferredContactMethod} onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value as any })}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="messages">Portal Messages</option>
              </SelectField>
            </div>
          </div>
        )}

        {section === "location" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State / Region" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Time Zone" placeholder="America/New_York" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              <TextField label="Working Hours" placeholder="9:00 AM - 5:00 PM EST" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Business Address" placeholder="e.g. 100 Broadway, 24th Floor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <TextField label="Map Directions Link" placeholder="https://maps.google.com/..." value={form.mapDirectionsLink} onChange={(e) => setForm({ ...form, mapDirectionsLink: e.target.value })} />
            </div>
            <div>
              <TextField label="Availability Notes" placeholder="e.g. Out of office on Fridays" value={form.availabilityNotes} onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })} />
            </div>
          </div>
        )}

        {section === "socials" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <TextField label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              <TextField label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              <TextField label="Twitter / X URL" placeholder="https://x.com/..." value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Rich Text Notes (Client Overview)</FieldLabel>
              <RichEditor value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} minHeight={120} />
            </div>
            <div>
              <FieldLabel>Internal Notes (Visible only to team)</FieldLabel>
              <textarea
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                placeholder="Important account secrets, negotiation margins..."
                className="h-16 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
              />
            </div>
          </div>
        )}
      </FieldGroup>
    </AppDialog>
  );
}

function ArchiveClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.clientId as string;
  const c = useStore((s) => s.clients.find((c) => c.id === id));
  const archive = useStore((s) => s.archiveClient);
  const { busy, run } = useAsyncAction();
  if (!c) return null;
  return (
    <ConfirmDialog
      title={`Archive ${c.name}?`}
      description="Archived clients are hidden from the active workspace but their data is retained."
      icon={<Archive className="h-5 w-5" />}
      confirmLabel="Archive client"
      destructive
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => archive(id), `${c.name} archived`);
        close();
      }}
    />
  );
}

function DeleteClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.clientId as string;
  const c = useStore((s) => s.clients.find((c) => c.id === id));
  const deleteClient = useStore((s) => s.deleteClient);
  const { busy, run } = useAsyncAction();
  if (!c) return null;
  return (
    <ConfirmDialog
      title={`Delete ${c.name}?`}
      description={`Are you sure you want to delete ${c.name}? This action is permanent and will delete all associated projects and requests.`}
      icon={<Trash2 className="h-5 w-5" />}
      confirmLabel="Delete client"
      destructive
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => deleteClient(id), `${c.name} deleted`);
        close();
      }}
    />
  );
}

function ClientStatusModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clientId = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const updateClient = useStore((s) => s.updateClient);
  const [status, setS] = useState(client?.status ?? "active");
  const { busy, run } = useAsyncAction();
  if (!client) return null;

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Change client status"
      description="Update the client lifecycle status."
      icon={<Flag className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => updateClient(client.id, { status: status as any }), "Status updated");
              close();
            }}
          >
            Apply
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-2">
        {(["active", "paused", "archived"] as const).map((s) => {
          const active = s === status;
          const label = s.charAt(0).toUpperCase() + s.slice(1);
          return (
            <button
              key={s}
              onClick={() => setS(s)}
              className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-colors ${
                active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <span className="text-xs font-semibold text-foreground">{label}</span>
              {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}

function ShareClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clientId = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const updateClient = useStore((s) => s.updateClient);
  const users = useStore((s) => s.users);

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [invitePermission, setInvitePermission] = useState<"owner" | "admin" | "edit" | "comment" | "view">("view");

  useEffect(() => {
    if (!client) return;

    // Users that should have share links:
    // 1. Primary contact (contactEmail)
    // 2. Additional contacts (email)
    // 3. Teammates already in client.shareLinks
    const activeUserIds = new Set<string>();
    if (client.contactEmail) {
      activeUserIds.add(client.contactEmail);
    }
    client.additionalContacts?.forEach((c) => {
      if (c.email) {
        activeUserIds.add(c.email);
      }
    });
    client.shareLinks?.forEach((link) => {
      activeUserIds.add(link.userId);
    });

    const currentLinks = client.shareLinks || [];
    const updatedLinks = [...currentLinks];
    let changed = false;

    activeUserIds.forEach((userId) => {
      if (!currentLinks.some((link) => link.userId === userId)) {
        const user = users.find((u) => u.id === userId || u.email === userId);
        const isClient = user ? user.role === "client" : true;

        const defaultPerm = isClient
          ? (userId === client.contactEmail ? "owner" : "view")
          : "admin";

        updatedLinks.push({
          id: `link-${Math.random().toString(36).substring(2, 9)}`,
          userId: userId,
          token: Math.random().toString(36).substring(2, 10),
          status: "active",
          permission: defaultPerm,
          createdAt: new Date().toISOString().split("T")[0],
        });
        changed = true;
      }
    });

    if (changed) {
      updateClient(client.id, { shareLinks: updatedLinks });
    }
  }, [client?.id, client?.contactEmail, client?.additionalContacts, users, updateClient]);

  if (!client) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const getFullUrl = (link: ProjectShareLink, role: string) => {
    const path = role === "client" ? "client" : "owner";
    return `${origin}/${path}/dashboard?clientId=${client.id}&token=${link.token}`;
  };

  const getUserForLink = (userId: string) => {
    const u = users.find((x) => x.id === userId || x.email === userId);
    if (u) return u;

    if (userId === client.contactEmail) {
      return {
        id: client.contactEmail,
        name: client.contact,
        email: client.contactEmail,
        role: "client" as const,
        title: client.contactRole || "Primary Contact",
        avatar: client.contact.split(" ").map((n) => n[0]).join(""),
        color: client.logoColor,
      };
    }

    const addContact = client.additionalContacts?.find((x) => x.email === userId);
    if (addContact) {
      return {
        id: addContact.email,
        name: addContact.name,
        email: addContact.email,
        role: "client" as const,
        title: addContact.title || "Contact",
        avatar: addContact.name.split(" ").map((n) => n[0]).join(""),
        color: client.logoColor,
      };
    }

    return null;
  };

  const copyLink = (link: ProjectShareLink, role: string) => {
    const user = getUserForLink(link.userId);
    const fullUrl = getFullUrl(link, role);
    navigator.clipboard.writeText(fullUrl);
    setCopiedLinkId(link.id);
    toast.success(user ? `Share link copied for ${user.name}` : `Share link copied`);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleToggleStatus = (link: ProjectShareLink) => {
    const updated = (client.shareLinks || []).map((l) =>
      l.id === link.id
        ? { ...l, status: l.status === "active" ? ("disabled" as const) : ("active" as const) }
        : l
    );
    updateClient(client.id, { shareLinks: updated });
    toast.success(link.status === "active" ? "Link disabled" : "Link activated");
  };

  const handleRegenerateLink = (link: ProjectShareLink) => {
    const newToken = Math.random().toString(36).substring(2, 10);
    const updated = (client.shareLinks || []).map((l) =>
      l.id === link.id
        ? { ...l, token: newToken, createdAt: new Date().toISOString().split("T")[0] }
        : l
    );
    updateClient(client.id, { shareLinks: updated });
    toast.success("Link token regenerated");
  };

  const handleRemoveAccess = (link: ProjectShareLink) => {
    const updatedLinks = (client.shareLinks || []).filter((l) => l.id !== link.id);
    updateClient(client.id, { shareLinks: updatedLinks });
    const user = getUserForLink(link.userId);
    toast.success(user ? `Removed ${user.name} from workspace` : "Access removed");
  };

  const handleUpdatePermission = (
    linkId: string,
    permission: "owner" | "admin" | "edit" | "comment" | "view"
  ) => {
    const link = (client.shareLinks || []).find((l) => l.id === linkId);
    if (!link) return;

    const updatedLinks = (client.shareLinks || []).map((l) =>
      l.id === linkId ? { ...l, permission } : l
    );
    updateClient(client.id, { shareLinks: updatedLinks });
    const user = getUserForLink(link.userId);
    toast.success(
      user ? `Updated ${user.name}'s permission to ${permission}` : "Permission updated"
    );
  };

  const uninvitedUsers = useMemo(() => {
    const existingUserIds = new Set((client.shareLinks || []).map((l) => l.userId));
    return users.filter((u) => u.role !== "client" && !existingUserIds.has(u.id));
  }, [users, client.shareLinks]);

  const handleInvite = () => {
    if (!selectedUserId) return;
    const userToInvite = users.find((u) => u.id === selectedUserId);
    if (!userToInvite) return;

    const newLink: ProjectShareLink = {
      id: `link-${Math.random().toString(36).substring(2, 9)}`,
      userId: userToInvite.id,
      token: Math.random().toString(36).substring(2, 10),
      status: "active",
      permission: invitePermission,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedLinks = [...(client.shareLinks || []), newLink];
    updateClient(client.id, { shareLinks: updatedLinks });
    toast.success(`Invited ${userToInvite.name} as ${invitePermission}`);
    setSelectedUserId("");
  };

  const activeLinks = client.shareLinks || [];

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Invite client"
      description="Manage access permissions and generate secure portal links for client contacts and internal team members."
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end">
          <GhostButton onClick={close}>Close</GhostButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Invite Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 border border-border/50 rounded-2xl p-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Invite Users
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer text-foreground"
            >
              {uninvitedUsers.length === 0 ? (
                <option value="" disabled>
                  All team members invited
                </option>
              ) : (
                <>
                  <option value="">Select user...</option>
                  {uninvitedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Team)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="sm:w-48 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Permission
            </label>
            <select
              value={invitePermission}
              onChange={(e) => setInvitePermission(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="edit">Can edit</option>
              <option value="comment">Can comment</option>
              <option value="view">Can view</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleInvite}
              disabled={!selectedUserId}
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite</span>
            </button>
          </div>
        </div>

        {/* Workspace Access List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>User Access & Links</span>
          </div>

          <div className="divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden">
            {activeLinks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active workspace access links.
              </div>
            ) : (
              activeLinks.map((link) => {
                const user = getUserForLink(link.userId);
                if (!user) return null;

                const isPrimary = link.userId === client.contactEmail;

                return (
                  <div
                    key={link.id}
                    className="p-4 hover:bg-muted/5 transition-colors space-y-3"
                  >
                    {/* Top Row: User Identity & Metadata */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={user} size={38} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-2 text-foreground">
                            <span>{user.name}</span>
                            {isPrimary ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Client Lead
                              </span>
                            ) : user.role === "client" ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Client
                              </span>
                            ) : (
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Team
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Metadata on the right of top row */}
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/30">
                        <Calendar className="h-3 w-3 text-muted-foreground/80" />
                        <span>Created {link.createdAt}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className={cn(
                          "font-medium",
                          link.lastUsedAt ? "text-foreground" : "text-muted-foreground/60"
                        )}>
                          {link.lastUsedAt ? `Used ${link.lastUsedAt}` : "Never used"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Share Link and Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/30">
                      {/* Left: Individual Link display & copy */}
                      <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 flex-1 min-w-0 max-w-md">
                        <span className="text-[10px] text-muted-foreground font-mono truncate select-all flex-1">
                          {getFullUrl(link, user.role)}
                        </span>
                        <button
                          onClick={() => copyLink(link, user.role)}
                          className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/50 cursor-pointer shrink-0"
                          title="Copy Link"
                        >
                          {copiedLinkId === link.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Right: Permission select & actions */}
                      <div className="flex items-center gap-3 justify-end shrink-0">
                        <select
                          value={link.permission}
                          onChange={(e) => handleUpdatePermission(link.id, e.target.value as any)}
                          className="h-8.5 rounded-xl border border-border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 cursor-pointer hover:bg-muted/50 transition-colors text-foreground font-medium"
                        >
                          {user.role === "client" ? (
                            <>
                              <option value="owner">Owner</option>
                              <option value="edit">Can edit</option>
                              <option value="comment">Can comment</option>
                              <option value="view">Can view</option>
                            </>
                          ) : (
                            <>
                              <option value="admin">Admin</option>
                              <option value="edit">Can edit</option>
                              <option value="comment">Can comment</option>
                              <option value="view">Can view</option>
                            </>
                          )}
                        </select>

                        <div className="flex items-center gap-1.5">
                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={cn(
                              "p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                              link.status === "active"
                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                : "border-muted-foreground/20 bg-muted/10 text-muted-foreground hover:bg-muted-foreground/10"
                            )}
                            title={link.status === "active" ? "Disable Link" : "Enable Link"}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          {/* Regenerate Link */}
                          <button
                            onClick={() => handleRegenerateLink(link)}
                            className="p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                            title="Regenerate Link"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>

                          {/* Remove Access */}
                          <button
                            onClick={() => handleRemoveAccess(link)}
                            className="p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove Access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

function InviteClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clientId = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const updateClient = useStore((s) => s.updateClient);
  const { busy, run } = useAsyncAction();

  const [form, setForm] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    department: "",
  });

  if (!client) return null;

  const valid = form.name.trim() && form.email.includes("@");

  const handleSubmit = async () => {
    if (!valid) return;
    const currentContacts = client.additionalContacts || [];
    const updatedContacts = [...currentContacts, { ...form }];
    
    await run(async () => {
      updateClient(client.id, { additionalContacts: updatedContacts });
    }, "Contact invited");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Invite Client Contact"
      description={`Add an additional member to ${client.name}'s workspace.`}
      icon={<UserPlus className="h-5 w-5" />}
      size="md"
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground">
            * Name and Email are required.
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton
              loading={busy}
              disabled={!valid}
              onClick={handleSubmit}
            >
              Send Invite
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Full Name" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <TextField label="Email Address" type="email" placeholder="e.g. john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Job Title" placeholder="e.g. Design Director" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Department" placeholder="e.g. Marketing" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        <div>
          <TextField label="Phone Number" placeholder="e.g. +1 (555) 019-1234" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ClientSettingsModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clientId = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const updateClient = useStore((s) => s.updateClient);
  const { busy, run } = useAsyncAction();

  const [form, setForm] = useState(() => ({
    status: client?.status ?? "active",
    health: client?.health ?? "healthy",
    retainer: client?.retainer ?? "Project",
  }));

  if (!client) return null;

  const handleSubmit = async () => {
    await run(async () => {
      updateClient(client.id, form);
    }, "Client settings updated");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Client Settings"
      description={`Manage status, health metrics, and business terms for ${client.name}.`}
      icon={<Settings className="h-5 w-5" />}
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={handleSubmit}
          >
            Save Settings
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </SelectField>
            <SelectField label="Account Health" value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value as any })}>
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="at-risk">At Risk</option>
            </SelectField>
          </div>
          <div>
            <TextField label="Retainer Terms" placeholder="e.g. $15k / mo or Project-based" value={form.retainer} onChange={(e) => setForm({ ...form, retainer: e.target.value })} />
          </div>
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

/* ─────────────────────────── Modals: Tasks ─────────────────────────── */

function NewTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const create = useStore((s) => s.createTask);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    projectId: (payload?.projectId as string) ?? projects[0]?.id ?? "",
    title: "",
    note: "",
    stage: (payload?.stage as TaskStage) ?? ("todo" as TaskStage),
    priority: "medium" as Priority,
    dueDate: "",
    startDate: "",
    estimatedHours: 0,
    tagsInput: "",
    assignees: [] as string[],
    followers: [] as string[],
    clientPriority: "Normal" as "Low" | "Normal" | "High",
  });
  const valid = form.title.trim().length > 1 && !!form.projectId;

  const handleSubmit = async () => {
    if (!valid) return;
    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const customFields = {
      "Client Priority": form.clientPriority,
    };
    await run(
      () =>
        create({
          projectId: form.projectId,
          title: form.title,
          note: form.note,
          stage: form.stage,
          priority: form.priority,
          dueDate: form.dueDate,
          startDate: form.startDate,
          estimatedHours: form.estimatedHours,
          tags,
          followers: form.followers,
          customFields,
        }),
      "Task created"
    );
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="New task"
      description="Describe the work and route it to the right person."
      icon={<ListTodo className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton disabled={!valid} loading={busy} onClick={handleSubmit}>
            Create task
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField
          label="Title"
          placeholder="e.g. Polish hero animation"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          autoFocus
        />
        
        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor
            value={form.note}
            onChange={(v) => setForm({ ...form, note: v })}
            placeholder="Context, links, @mentions…"
            minHeight={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Project"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Stage"
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as TaskStage })}
          >
            {(Object.keys(STAGE_META) as TaskStage[]).map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          >
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <TextField
            label="Estimated Hours"
            type="number"
            value={form.estimatedHours || ""}
            onChange={(e) => setForm({ ...form, estimatedHours: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Tags"
            placeholder="e.g. Design, Frontend (comma-separated)"
            value={form.tagsInput}
            onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
          />
          <SelectField
            label="Client Priority (Custom Field)"
            value={form.clientPriority}
            onChange={(e) => setForm({ ...form, clientPriority: e.target.value as any })}
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </SelectField>
        </div>

        <div>
          <FieldLabel>Assignees</FieldLabel>
          <MultiUserPicker
            users={team}
            selected={form.assignees}
            onChange={(assignees) => setForm({ ...form, assignees })}
          />
        </div>

        <div>
          <FieldLabel>Followers (Watchers)</FieldLabel>
          <MultiUserPicker
            users={team}
            selected={form.followers}
            onChange={(followers) => setForm({ ...form, followers })}
          />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function EditTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.taskId as string;
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const projects = useStore((s) => s.projects);
  const update = useStore((s) => s.updateTask);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    note: task?.note ?? "",
    projectId: task?.projectId ?? "",
    stage: task?.stage ?? ("todo" as TaskStage),
    priority: task?.priority ?? ("medium" as Priority),
    dueDate: task?.dueDate ?? "",
    progress: task?.progress ?? 0,
  }));
  if (!task) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit task"
      description="Refine the brief, ETA or progress."
      icon={<ListChecks className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => update(id, form), "Task updated");
              close();
            }}
          >
            Save changes
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor value={form.note} onChange={(v) => setForm({ ...form, note: v })} minHeight={120} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <TextField label="Due date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as TaskStage })}>
            {(Object.keys(STAGE_META) as TaskStage[]).map((s) => (
              <option key={s} value={s}>{STAGE_META[s].label}</option>
            ))}
          </SelectField>
          <SelectField label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            ))}
          </SelectField>
          <TextField
            label="Progress %"
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
          />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function DeleteTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.taskId as string;
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const del = useStore((s) => s.deleteTask);
  const { busy, run } = useAsyncAction();
  if (!task) return null;
  return (
    <ConfirmDialog
      title="Delete this task?"
      description={`“${task.title}” will be permanently removed from the project board.`}
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Delete task"
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => del(id), "Task deleted");
        close();
      }}
    />
  );
}

function AssignTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.taskId as string;
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const assign = useStore((s) => s.assignTask);
  const [selected, setSelected] = useState<string[]>(task?.assignees ?? []);
  const { busy, run } = useAsyncAction();
  if (!task) return null;

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Assign team members"
      description={`Choose who's working on “${task.title}”.`}
      icon={<Users className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => assign(id, selected), "Assignees updated");
              close();
            }}
          >
            Save
          </PrimaryButton>
        </div>
      }
    >
      <MultiUserPicker users={team} selected={selected} onChange={setSelected} />
    </AppDialog>
  );
}

function TaskStatusModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.taskId as string;
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const set = useStore((s) => s.setTaskStage);
  const [stage, setStage] = useState<TaskStage>(task?.stage ?? "todo");
  const { busy, run } = useAsyncAction();
  if (!task) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Update task status"
      description={task.title}
      icon={<CircleDot className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => set(id, stage), `Moved to ${STAGE_META[stage].label}`);
              close();
            }}
          >
            Apply
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(STAGE_META) as TaskStage[]).map((s) => {
          const m = STAGE_META[s];
          const active = s === stage;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <span className={`flex items-center gap-2 text-sm font-medium ${m.pill}`}>
                <span className={`h-2 w-2 rounded-full ${m.dot}`} /> {m.label}
              </span>
              {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}

function TaskPriorityModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.taskId as string;
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const setP = useStore((s) => s.setTaskPriority);
  const [p, setP2] = useState<Priority>(task?.priority ?? "medium");
  const { busy, run } = useAsyncAction();
  if (!task) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Set priority"
      description={task.title}
      icon={<Flag className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => setP(id, p), "Priority updated");
              close();
            }}
          >
            Apply
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(PRIORITY_META) as Priority[]).map((pr) => {
          const m = PRIORITY_META[pr];
          const active = pr === p;
          return (
            <button
              key={pr}
              onClick={() => setP2(pr)}
              className={`rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>
              {active && <div className="mt-1.5 text-[11px] text-primary">Selected</div>}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}

/* ─────────────────────────── Modals: Requests ─────────────────────────── */

function NewRequestModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const create = useStore((s) => s.createRequest);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    clientId: (payload?.clientId as string) ?? clients[0]?.id ?? "",
    projectId: "" as string,
    type: "revision" as RequestType,
    title: "",
    description: "",
    estimatedHours: 2,
    priority: "medium" as Priority,
  });
  const valid = form.title.trim().length > 1 && !!form.clientId;
  const clientProjects = projects.filter((p) => p.clientId === form.clientId);

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Log a request"
      description="Capture a client ask so it shows up in the queue and on the right project."
      icon={<Inbox className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => {
              await run(
                () => create({ ...form, projectId: form.projectId || undefined }),
                "Request logged",
              );
              close();
            }}
          >
            Submit request
          </PrimaryButton>
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
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summarize the ask" />
        <div>
          <FieldLabel>Details</FieldLabel>
          <RichEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Context, references, success criteria…" minHeight={140} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Project (optional)" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">— None —</option>
            {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <TextField label="Est. hours" type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ReviewRequestModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const client = useStore((s) => s.clients.find((c) => c.id === req?.clientId));
  const setStatus = useStore((s) => s.setRequestStatus);
  const { busy, run } = useAsyncAction();
  const { open } = useModals();
  if (!req || !client) return null;
  const tm = REQUEST_TYPE_META[req.type];
  const pm = PRIORITY_META[req.priority];
  const sm = REQUEST_STATUS_META[req.status];

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Review request"
      description={`From ${client.name} · ${req.submittedAt}`}
      icon={<Inbox className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <GhostButton onClick={close}>Close</GhostButton>
          <button
            onClick={() => open("request.convertTask", { requestId: id })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Convert to task
          </button>
          <button
            onClick={() => open("request.convertProject", { requestId: id })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <FolderPlus className="h-3.5 w-3.5" /> Convert to project
          </button>
          <button
            onClick={() => open("request.reject", { requestId: id })}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => setStatus(id, "approved"), "Request approved");
              close();
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sm.cls}`}>{sm.label}</span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">{tm.label}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${pm.cls}`}>{pm.label}</span>
          {req.estimatedHours && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">~{req.estimatedHours}h estimate</span>
          )}
        </div>
        <h3 className="text-lg font-semibold">{req.title}</h3>
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground/80">
          {req.description}
        </div>
        <div>
          <FieldLabel>Internal note</FieldLabel>
          <RichEditor value="" onChange={() => {}} placeholder="Add context for the team before deciding…" minHeight={100} />
        </div>
      </div>
    </AppDialog>
  );
}

function ApproveRequestModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const setStatus = useStore((s) => s.setRequestStatus);
  const { busy, run } = useAsyncAction();
  return (
    <ConfirmDialog
      title="Approve this request?"
      description="Approval will notify the client and move this request out of the queue."
      icon={<CheckCircle2 className="h-5 w-5" />}
      confirmLabel="Approve"
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => setStatus(id, "approved"), "Request approved");
        close();
      }}
    />
  );
}

function RejectRequestModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const setStatus = useStore((s) => s.setRequestStatus);
  const [reason, setReason] = useState("");
  const { busy, run } = useAsyncAction();
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Reject request"
      description="Let the client know why so we can keep the relationship strong."
      icon={<XCircle className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <DangerButton
            loading={busy}
            onClick={async () => {
              if (!reason.trim()) return toast.error("Add a short reason before rejecting.");
              await run(() => setStatus(id, "rejected"), "Request rejected");
              close();
            }}
          >
            Reject request
          </DangerButton>
        </div>
      }
    >
      <FieldGroup>
        <div>
          <FieldLabel>Reason</FieldLabel>
          <RichEditor value={reason} onChange={setReason} placeholder="e.g. Out of scope for current sprint — let's revisit Q3." minHeight={120} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ConvertRequestToTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const projects = useStore((s) => s.projects).filter((p) => p.clientId === req?.clientId);
  const convert = useStore((s) => s.convertRequestToTask);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const { busy, run } = useAsyncAction();
  if (!req) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Convert request to task"
      description="Pick the project to add this work into."
      icon={<ArrowRightLeft className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!projectId}
            onClick={async () => {
              await run(() => convert(id, projectId), "Converted to task");
              close();
            }}
          >
            Convert
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Original request</div>
          <div className="mt-1 font-medium">{req.title}</div>
        </div>
        <SelectField label="Add to project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.length === 0 && <option value="">No projects for this client</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
      </FieldGroup>
    </AppDialog>
  );
}

function ConvertRequestToProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const convert = useStore((s) => s.convertRequestToProject);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const [form, setForm] = useState(() => ({
    name: req?.title ?? "",
    type: "fixed" as "fixed" | "hourly",
    budget: 15000,
    hoursEstimate: 80,
    team: [] as string[],
  }));
  const { busy, run } = useAsyncAction();
  if (!req) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Convert request to project"
      description="Scaffold a new project from this request."
      icon={<FolderPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => convert(id, form), "Project created from request");
              close();
            }}
          >
            Create project
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
            <option value="fixed">Fixed bid</option>
            <option value="hourly">Hourly</option>
          </SelectField>
          <TextField label="Budget" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
          <TextField label="Hours est." type="number" value={form.hoursEstimate} onChange={(e) => setForm({ ...form, hoursEstimate: Number(e.target.value) })} />
        </div>
        <div>
          <FieldLabel>Team</FieldLabel>
          <MultiUserPicker users={team} selected={form.team} onChange={(team) => setForm({ ...form, team })} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

/* ─────────────────────────── Modals: Documents ─────────────────────────── */

function UploadDocumentModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const docs = useStore((s) => s.documents);
  const upload = useStore((s) => s.uploadDocument);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    projectId: (payload?.projectId as string) ?? projects[0]?.id ?? "",
    name: "",
    folder: (payload?.folder as string) ?? "General",
    shared: false,
    size: undefined as string | undefined,
    previewUrl: undefined as string | undefined,
  });
  const folders = Array.from(new Set(docs.filter((d) => d.projectId === form.projectId).map((d) => d.folder)));
  if (!folders.includes("General")) folders.push("General");

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Upload document"
      icon={<Upload className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!form.name.trim()}
            onClick={async () => { await run(() => upload(form), "Document uploaded"); close(); }}
          >
            Upload
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <Dropzone
          onFileSelect={(info) => {
            setForm((f) => ({
              ...f,
              name: info.name,
              size: info.size,
              previewUrl: info.previewUrl,
            }));
          }}
        />
        <TextField label="File name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. brief-v2.pdf" />
        <div className="grid grid-cols-2 gap-3">
          {!payload?.projectId ? (
            <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectField>
          ) : null}
          <div className={payload?.projectId ? "col-span-2" : ""}>
            <SelectField label="Folder" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}>
              {folders.map((f) => <option key={f} value={f}>{f}</option>)}
            </SelectField>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={form.shared} onChange={(e) => setForm({ ...form, shared: e.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
          Share with client
        </label>
      </FieldGroup>
    </AppDialog>
  );
}

function NewFolderModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const create = useStore((s) => s.createFolder);
  const [projectId, setProjectId] = useState((payload?.projectId as string) ?? projects[0]?.id ?? "");
  const [name, setName] = useState("");
  const { busy, run } = useAsyncAction();

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Create folder"
      icon={<FolderPlusIcon className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!name.trim()}
            onClick={async () => {
              const finalName = name.trim();
              await run(() => create(projectId, finalName), "Folder created");
              close();
            }}
          >
            Create folder
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        {!payload?.projectId && (
          <SelectField label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
        )}
        <TextField label="Folder name" placeholder="e.g. Brand assets" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </FieldGroup>
    </AppDialog>
  );
}

function RenameFolderModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const oldName = (payload?.folder as string) ?? "";
  const rename = useStore((s) => s.renameFolder);
  const [name, setName] = useState(oldName);
  const { busy, run } = useAsyncAction();
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Rename folder"
      icon={<Folder className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!name.trim() || name === oldName}
            onClick={async () => { await run(() => rename(projectId, oldName, name.trim()), "Folder renamed"); close(); }}
          >
            Rename
          </PrimaryButton>
        </div>
      }
    >
      <TextField label="Folder name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
    </AppDialog>
  );
}

function DeleteFolderModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const folder = (payload?.folder as string) ?? "";
  const del = useStore((s) => s.deleteFolder);
  const { busy, run } = useAsyncAction();
  return (
    <ConfirmDialog
      title="Delete folder?"
      description={`This folder and all its contents will be permanently deleted.`}
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Delete folder"
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => del(projectId, folder), "Folder and files deleted");
        close();
      }}
    />
  );
}

function RenameFileModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.documentId as string;
  const doc = useStore((s) => s.documents.find((d) => d.id === id));
  const rename = useStore((s) => s.renameDocument);
  const [name, setName] = useState(doc?.name ?? "");
  const { busy, run } = useAsyncAction();
  if (!doc) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Rename file"
      icon={<FileText className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!name.trim() || name === doc.name}
            onClick={async () => { await run(() => rename(id, name.trim()), "File renamed"); close(); }}
          >
            Rename
          </PrimaryButton>
        </div>
      }
    >
      <TextField label="File name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
    </AppDialog>
  );
}

function ConnectProjectStorageModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const mapStorage = useStore((s) => s.mapProjectStorage);
  
  const [step, setStep] = useState<"provider" | "auth" | "folder">("provider");
  const [provider, setProvider] = useState<"gdrive" | "dropbox" | "onedrive" | "box" | null>(null);
  const [email, setEmail] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const { busy, run } = useAsyncAction();

  const providers = [
    { id: "gdrive" as const, name: "Google Drive", icon: Cloud, desc: "Connect Google Drive shared team drives" },
    { id: "dropbox" as const, name: "Dropbox", icon: FolderOpen, desc: "Connect Dropbox design repositories" },
    { id: "onedrive" as const, name: "OneDrive", icon: Cloud, desc: "Connect OneDrive business directories" },
    { id: "box" as const, name: "Box", icon: HardDrive, desc: "Connect Box enterprise secure folders" },
  ];

  const mockFolders = {
    gdrive: ["/Client Deliverables", "/Briefs & Contracts", "/Shared Materials"],
    dropbox: ["/Design Assets", "/Raw Footage", "/Brand Guidelines"],
    onedrive: ["/Company Docs", "/Marketing Materials", "/Finance Sheets"],
    box: ["/Secure Archives", "/External Receipts", "/Vendor Uploads"],
  };

  const currentProviderName = providers.find((p) => p.id === provider)?.name ?? "";

  const handleConnect = async () => {
    if (!provider || !email.trim() || !selectedFolder) return;
    await run(
      () => mapStorage(projectId, provider, email.trim(), selectedFolder),
      `Connected ${currentProviderName} folder successfully`
    );
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={
        step === "provider"
          ? "Connect External Storage"
          : step === "auth"
          ? `Authenticate ${currentProviderName}`
          : `Select Folder from ${currentProviderName}`
      }
      icon={
        provider === "dropbox" ? <FolderOpen className="h-5 w-5" /> : provider === "box" ? <HardDrive className="h-5 w-5" /> : <Cloud className="h-5 w-5" />
      }
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          {step === "auth" && (
            <PrimaryButton
              disabled={!email.trim() || !email.includes("@")}
              onClick={() => setStep("folder")}
            >
              Next: Select Folder
            </PrimaryButton>
          )}
          {step === "folder" && (
            <PrimaryButton
              loading={busy}
              disabled={!selectedFolder}
              onClick={handleConnect}
            >
              Connect Folder
            </PrimaryButton>
          )}
        </div>
      }
    >
      {step === "provider" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {providers.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p.id);
                  setStep("auth");
                }}
                className="flex flex-col items-start p-4 rounded-2xl border border-border/60 hover:bg-muted text-left transition-colors cursor-pointer"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</div>
              </button>
            );
          })}
        </div>
      )}

      {step === "auth" && (
        <FieldGroup>
          <TextField
            label="Account Email"
            placeholder="e.g. storage@kristal-brand.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoFocus
          />
        </FieldGroup>
      )}

      {step === "folder" && provider && (
        <div className="space-y-3">
          <FieldLabel>Choose Folder to Link</FieldLabel>
          <div className="space-y-1">
            {mockFolders[provider].map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3 border text-left font-medium transition-all cursor-pointer text-sm",
                  selectedFolder === folder
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 hover:bg-muted text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {folder}
                </span>
                <span className={cn(
                  "h-4 w-4 rounded-full border flex items-center justify-center",
                  selectedFolder === folder ? "border-primary bg-primary" : "border-border"
                )}>
                  {selectedFolder === folder && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppDialog>
  );
}

function MoveFileModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.documentId as string;
  const doc = useStore((s) => s.documents.find((d) => d.id === id));
  const docs = useStore((s) => s.documents);
  const move = useStore((s) => s.moveDocument);
  const folders = Array.from(new Set(docs.filter((d) => d.projectId === doc?.projectId).map((d) => d.folder)));
  const [folder, setFolder] = useState(doc?.folder ?? folders[0] ?? "General");
  const { busy, run } = useAsyncAction();
  if (!doc) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={`Move “${doc.name}”`}
      icon={<Move className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={folder === doc.folder}
            onClick={async () => { await run(() => move(id, folder), "Moved"); close(); }}
          >
            Move file
          </PrimaryButton>
        </div>
      }
    >
      <SelectField label="Destination folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
        {folders.map((f) => <option key={f} value={f}>{f}</option>)}
      </SelectField>
    </AppDialog>
  );
}

function DeleteFileModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.documentId as string;
  const doc = useStore((s) => s.documents.find((d) => d.id === id));
  const del = useStore((s) => s.deleteDocument);
  const { busy, run } = useAsyncAction();
  if (!doc) return null;
  return (
    <ConfirmDialog
      title="Delete this file?"
      description={`${doc.name} will be permanently removed.`}
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Delete file"
      busy={busy}
      onCancel={close}
      onConfirm={async () => { await run(() => del(id), "File deleted"); close(); }}
    />
  );
}

/* ─────────────────────────── Modals: Team ─────────────────────────── */

function AddMemberModal({ close }: { close: () => void; payload?: ModalPayload }) {
  const add = useStore((s) => s.addTeamMember);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({ name: "", email: "", title: "Designer", role: "team" as "team" | "owner" });
  const valid = form.name && form.email.includes("@");
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Invite team member"
      description="They'll be able to access internal projects immediately."
      icon={<UserPlus className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => { await run(() => add(form), `Invite sent to ${form.email}`); close(); }}
          >
            Send invite
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "team" | "owner" })}>
            <option value="team">Team</option>
            <option value="owner">Owner</option>
          </SelectField>
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function EditMemberModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.userId as string;
  const u = useStore((s) => s.users.find((u) => u.id === id));
  const update = useStore((s) => s.updateTeamMember);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({ name: u?.name ?? "", title: u?.title ?? "", email: u?.email ?? "", role: u?.role ?? "team" }));
  if (!u) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit team member"
      icon={<UserCog className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton loading={busy} onClick={async () => { await run(() => update(id, form), "Member updated"); close(); }}>Save</PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
            <option value="team">Team</option>
            <option value="owner">Owner</option>
            <option value="client">Client</option>
          </SelectField>
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function RemoveMemberModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.userId as string;
  const u = useStore((s) => s.users.find((u) => u.id === id));
  const remove = useStore((s) => s.removeTeamMember);
  const { busy, run } = useAsyncAction();
  if (!u) return null;
  return (
    <ConfirmDialog
      title={`Remove ${u.name}?`}
      description="They'll lose access to all internal projects immediately. Their past work and time entries are retained."
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Remove member"
      busy={busy}
      onCancel={close}
      onConfirm={async () => { await run(() => remove(id), `${u.name} removed`); close(); }}
    />
  );
}

/* ─────────────────────────── Modals: Time ─────────────────────────── */

function LogTimeModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const log = useStore((s) => s.logTime);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    userId: "u1",
    projectId: (payload?.projectId as string) ?? projects[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
    hours: 1,
    note: "",
    billable: true,
  });
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Log time"
      description="Track hours against a project so reporting and budgets stay accurate."
      icon={<Clock className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!form.projectId || form.hours <= 0}
            onClick={async () => { await run(() => log(form), `Logged ${form.hours}h`); close(); }}
          >
            Log time
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <SelectField label="Member" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
            {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </SelectField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TextField label="Hours" type="number" step="0.25" min="0" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
          <SelectField label="Billable" value={form.billable ? "y" : "n"} onChange={(e) => setForm({ ...form, billable: e.target.value === "y" })}>
            <option value="y">Billable</option>
            <option value="n">Non-billable</option>
          </SelectField>
        </div>
        <TextField label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="What did you work on?" />
      </FieldGroup>
    </AppDialog>
  );
}

function EditTimeModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.timeId as string;
  const entry = useStore((s) => s.timeEntries.find((t) => t.id === id));
  const projects = useStore((s) => s.projects);
  const update = useStore((s) => s.updateTimeEntry);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    projectId: entry?.projectId ?? "",
    date: entry?.date ?? today2(),
    hours: entry?.hours ?? 0,
    note: entry?.note ?? "",
    billable: entry?.billable ?? true,
  }));
  if (!entry) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit time entry"
      icon={<Clock className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton loading={busy} onClick={async () => { await run(() => update(id, form), "Entry updated"); close(); }}>Save</PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <TextField label="Hours" type="number" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
          <SelectField label="Billable" value={form.billable ? "y" : "n"} onChange={(e) => setForm({ ...form, billable: e.target.value === "y" })}>
            <option value="y">Billable</option>
            <option value="n">Non-billable</option>
          </SelectField>
        </div>
        <TextField label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </FieldGroup>
    </AppDialog>
  );
}
function today2() { return new Date().toISOString().slice(0, 10); }

function DeleteTimeModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.timeId as string;
  const entry = useStore((s) => s.timeEntries.find((t) => t.id === id));
  const del = useStore((s) => s.deleteTimeEntry);
  const { busy, run } = useAsyncAction();
  if (!entry) return null;
  return (
    <ConfirmDialog
      title="Delete time entry?"
      description={`This time entry of ${entry.hours}h will be permanently removed.`}
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Delete entry"
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(() => del(id), "Time entry deleted");
        close();
      }}
    />
  );
}

/* ─────────────────────────── Modals: AI ─────────────────────────── */

export type AIPlannedAction = {
  id: string;
  title: string;
  detail: string;
  iconKey: "task" | "project" | "summary" | "draft" | "time" | "move";
};

function AIReviewModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const actions = (payload?.actions as AIPlannedAction[]) ?? [];
  const intent = (payload?.intent as string) ?? "Run requested actions";
  const logAI = useStore((s) => s.logAIAction);
  const [selected, setSelected] = useState<Set<string>>(new Set(actions.map((a) => a.id)));
  const { busy, run } = useAsyncAction();

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="AI action review"
      description={`Confirm the actions before they run. ${intent}`}
      icon={<Sparkles className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selected.size} of {actions.length} action{actions.length === 1 ? "" : "s"} will run.
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton
              loading={busy}
              disabled={selected.size === 0}
              onClick={async () => {
                await run(() => {
                  actions
                    .filter((a) => selected.has(a.id))
                    .forEach((a) => logAI({ iconKey: a.iconKey, title: a.title, meta: a.detail }));
                }, `${selected.size} action${selected.size === 1 ? "" : "s"} confirmed`);
                close();
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm &amp; run
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-2.5">
        {actions.map((a) => {
          const isOn = selected.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() =>
                setSelected((cur) => {
                  const next = new Set(cur);
                  if (next.has(a.id)) next.delete(a.id);
                  else next.add(a.id);
                  return next;
                })
              }
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${isOn ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.detail}</div>
              </div>
              <div className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${isOn ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                {isOn && <CheckCircle2 className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}

function AIConfirmModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const title = (payload?.title as string) ?? "Confirm AI action";
  const description = (payload?.description as string) ?? "This will execute the suggested action.";
  const { busy, run } = useAsyncAction();
  const onConfirm = payload?.onConfirm as (() => void) | undefined;
  return (
    <ConfirmDialog
      title={title}
      description={description}
      icon={<Sparkles className="h-5 w-5" />}
      confirmLabel="Run action"
      busy={busy}
      onCancel={close}
      onConfirm={async () => {
        await run(async () => onConfirm?.(), "Action completed");
        close();
      }}
    />
  );
}

/* ─────────────────────────── Shared dialogs ─────────────────────────── */

function ConfirmDialog({
  title,
  description,
  icon,
  confirmLabel = "Confirm",
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && onCancel()}
      title={title}
      description={description}
      icon={icon}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          {destructive ? (
            <DangerButton loading={busy} onClick={onConfirm}>{confirmLabel}</DangerButton>
          ) : (
            <PrimaryButton loading={busy} onClick={onConfirm}>{confirmLabel}</PrimaryButton>
          )}
        </div>
      }
    >
      <div className="text-sm text-muted-foreground">
        Double-check before continuing — this action will be reflected immediately across the workspace.
      </div>
    </AppDialog>
  );
}

/* ─────────────────────────── Shared form bits ─────────────────────────── */

function MultiUserPicker({
  users,
  selected,
  onChange,
}: {
  users: { id: string; name: string; title: string; color: string; avatar: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {users.map((u) => {
        const on = selected.includes(u.id);
        return (
          <button
            key={u.id}
            onClick={() => toggle(u.id)}
            className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-colors ${on ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted"}`}
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: u.color }}
            >
              {u.avatar}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{u.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{u.title}</span>
            </span>
            {on && <CheckCircle2 className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function Dropzone({
  onFileName,
  onFileSelect,
}: {
  onFileName?: (n: string) => void;
  onFileSelect?: (fileInfo: { name: string; size: string; previewUrl?: string }) => void;
}) {
  const [hover, setHover] = useState(false);
  const [name, setName] = useState<string | null>(null);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) {
          setName(f.name);
          onFileName?.(f.name);
          let previewUrl: string | undefined;
          if (f.type.startsWith("image/")) {
            previewUrl = URL.createObjectURL(f);
          }
          const sizeStr = f.size > 1024 * 1024
            ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(f.size / 1024).toFixed(0)} KB`;
          onFileSelect?.({ name: f.name, size: sizeStr, previewUrl });
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${hover ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted"}`}
    >
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setName(f.name);
            onFileName?.(f.name);
            let previewUrl: string | undefined;
            if (f.type.startsWith("image/")) {
              previewUrl = URL.createObjectURL(f);
            }
            const sizeStr = f.size > 1024 * 1024
              ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
              : `${(f.size / 1024).toFixed(0)} KB`;
            onFileSelect?.({ name: f.name, size: sizeStr, previewUrl });
          }
        }}
      />
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
        {name ? <FilePlus2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
      </div>
      <div className="text-sm font-medium">{name ?? "Drop a file or click to browse"}</div>
      <div className="text-[11px] text-muted-foreground">PDF, PNG, JPG, ZIP — up to 100 MB</div>
    </label>
  );
}

/* ─────────────────────────── Share, Invite & Settings Modals ─────────────────────────── */

function ShareProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const users = useStore((s) => s.users);
  const clients = useStore((s) => s.clients);
  const updateProject = useStore((s) => s.updateProject);

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [invitePermission, setInvitePermission] = useState<"admin" | "edit" | "comment" | "view">("view");

  useEffect(() => {
    if (!project) return;

    // Get the client contact user
    const client = clients.find((c) => c.id === project.clientId);
    const clientUser = users.find((u) => u.email === client?.contactEmail);

    // All user IDs that should have access:
    // 1. All users in project.team
    // 2. Client contact user (if found)
    const activeUserIds = new Set<string>();
    project.team.forEach((id) => activeUserIds.add(id));
    if (clientUser) {
      activeUserIds.add(clientUser.id);
    }

    const currentLinks = project.shareLinks || [];
    const updatedLinks = [...currentLinks];
    let changed = false;

    activeUserIds.forEach((userId) => {
      if (!currentLinks.some((link) => link.userId === userId)) {
        const user = users.find((u) => u.id === userId);
        if (user) {
          const defaultPerm =
            user.id === project.lead
              ? "admin"
              : user.role === "owner"
              ? "admin"
              : user.role === "team"
              ? "edit"
              : "view";

          updatedLinks.push({
            id: `link-${Math.random().toString(36).substring(2, 9)}`,
            userId: user.id,
            token: Math.random().toString(36).substring(2, 10),
            status: "active",
            permission: defaultPerm,
            createdAt: new Date().toISOString().split("T")[0],
          });
          changed = true;
        }
      }
    });

    if (changed) {
      updateProject(project.id, { shareLinks: updatedLinks });
    }
  }, [project?.id, project?.team, project?.clientId, project?.lead, users, clients, updateProject]);

  if (!project) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const getFullUrl = (link: ProjectShareLink, role: string) => {
    const path = role === "client" ? "client" : "owner";
    return `${origin}/${path}/projects/${project.id}?token=${link.token}`;
  };

  const copyLink = (link: ProjectShareLink) => {
    const user = users.find((u) => u.id === link.userId);
    if (!user) return;
    const fullUrl = getFullUrl(link, user.role);
    navigator.clipboard.writeText(fullUrl);
    setCopiedLinkId(link.id);
    toast.success(`Share link copied for ${user.name}`);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleToggleStatus = (link: ProjectShareLink) => {
    const updated = (project.shareLinks || []).map((l) =>
      l.id === link.id
        ? { ...l, status: l.status === "active" ? ("disabled" as const) : ("active" as const) }
        : l
    );
    updateProject(project.id, { shareLinks: updated });
    toast.success(link.status === "active" ? "Link disabled" : "Link activated");
  };

  const handleRegenerateLink = (link: ProjectShareLink) => {
    const newToken = Math.random().toString(36).substring(2, 10);
    const updated = (project.shareLinks || []).map((l) =>
      l.id === link.id
        ? { ...l, token: newToken, createdAt: new Date().toISOString().split("T")[0] }
        : l
    );
    updateProject(project.id, { shareLinks: updated });
    toast.success("Link token regenerated");
  };

  const handleRemoveAccess = (link: ProjectShareLink) => {

    // Remove link
    const updatedLinks = (project.shareLinks || []).filter((l) => l.id !== link.id);

    // Remove from project.team if it's a team member
    const updatedTeam = project.team.filter((id) => id !== link.userId);

    // Clean up member permissions
    const updatedPermissions = { ...(project.memberPermissions || {}) };
    delete updatedPermissions[link.userId];

    updateProject(project.id, {
      shareLinks: updatedLinks,
      team: updatedTeam,
      memberPermissions: updatedPermissions,
    });

    const user = users.find((u) => u.id === link.userId);
    toast.success(user ? `Removed ${user.name} from project` : "Access removed");
  };

  const handleUpdatePermission = (
    linkId: string,
    permission: "owner" | "admin" | "edit" | "comment" | "view"
  ) => {
    const link = (project.shareLinks || []).find((l) => l.id === linkId);
    if (!link) return;

    const updatedLinks = (project.shareLinks || []).map((l) =>
      l.id === linkId ? { ...l, permission } : l
    );

    const updatedPermissions = {
      ...(project.memberPermissions || {}),
      [link.userId]: permission === "owner" ? ("owner" as const) : permission,
    };

    updateProject(project.id, {
      shareLinks: updatedLinks,
      memberPermissions: updatedPermissions,
    });

    const user = users.find((u) => u.id === link.userId);
    toast.success(
      user ? `Updated ${user.name}'s permission to ${permission}` : "Permission updated"
    );
  };

  const uninvitedUsers = useMemo(() => {
    const existingUserIds = new Set((project.shareLinks || []).map((l) => l.userId));
    return users.filter((u) => u.role !== "client" && !existingUserIds.has(u.id));
  }, [users, project.shareLinks]);

  const activeTeamShareLinks = useMemo(() => {
    return (project.shareLinks || []).filter((link) => {
      const user = users.find((u) => u.id === link.userId);
      return user && user.role !== "client";
    });
  }, [project.shareLinks, users]);

  const handleInvite = () => {
    if (!selectedUserId) return;
    const userToInvite = users.find((u) => u.id === selectedUserId);
    if (!userToInvite) return;

    const newLink: ProjectShareLink = {
      id: `link-${Math.random().toString(36).substring(2, 9)}`,
      userId: userToInvite.id,
      token: Math.random().toString(36).substring(2, 10),
      status: "active",
      permission: invitePermission,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedLinks = [...(project.shareLinks || []), newLink];
    const patch: Partial<Project> = { shareLinks: updatedLinks };

    if (userToInvite.role !== "client") {
      patch.team = [...project.team, userToInvite.id];
    }

    updateProject(project.id, patch);
    toast.success(`Invited ${userToInvite.name} as ${invitePermission}`);
    setSelectedUserId("");
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Invite Team"
      description="Manage access permissions and generate unique secure links for team members."
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end">
          <GhostButton onClick={close}>Close</GhostButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Invite Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 border border-border/50 rounded-2xl p-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Invite Team Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer text-foreground"
            >
              {uninvitedUsers.length === 0 ? (
                <option value="" disabled>
                  All team members invited
                </option>
              ) : (
                <>
                  <option value="">Select team member...</option>
                  {uninvitedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Team)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="sm:w-48 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Permission
            </label>
            <select
              value={invitePermission}
              onChange={(e) => setInvitePermission(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="edit">Can edit</option>
              <option value="comment">Can comment</option>
              <option value="view">Can view</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleInvite}
              disabled={!selectedUserId}
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite</span>
            </button>
          </div>
        </div>

        {/* Project Access List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Team Access & Links</span>
          </div>

          <div className="divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden">
            {activeTeamShareLinks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active share links. Invite someone above to get started.
              </div>
            ) : (
              activeTeamShareLinks.map((link) => {
                const user = users.find((u) => u.id === link.userId);
                if (!user) return null;

                return (
                  <div
                    key={link.id}
                    className="p-4 hover:bg-muted/5 transition-colors space-y-3"
                  >
                    {/* Top Row: User Identity & Metadata */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={user} size={38} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-2 text-foreground">
                            <span>{user.name}</span>
                            {user.id === project.lead ? (
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Project Lead
                              </span>
                            ) : user.role === "client" ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Client
                              </span>
                            ) : (
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Team
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Metadata on the right of top row */}
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/30">
                        <Calendar className="h-3 w-3 text-muted-foreground/80" />
                        <span>Created {link.createdAt}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className={cn(
                          "font-medium",
                          link.lastUsedAt ? "text-foreground" : "text-muted-foreground/60"
                        )}>
                          {link.lastUsedAt ? `Used ${link.lastUsedAt}` : "Never used"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Share Link and Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/30">
                      {/* Left: Individual Link display & copy */}
                      <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 flex-1 min-w-0 max-w-md">
                        <span className="text-[10px] text-muted-foreground font-mono truncate select-all flex-1">
                          {getFullUrl(link, user.role)}
                        </span>
                        <button
                          onClick={() => copyLink(link)}
                          className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/50 cursor-pointer shrink-0"
                          title="Copy Link"
                        >
                          {copiedLinkId === link.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Right: Permission select & actions */}
                      <div className="flex items-center gap-3 justify-end shrink-0">
                        <select
                          value={link.permission === "owner" ? "admin" : link.permission}
                          onChange={(e) => handleUpdatePermission(link.id, e.target.value as any)}
                          className="h-8.5 rounded-xl border border-border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 cursor-pointer hover:bg-muted/50 transition-colors text-foreground font-medium"
                        >
                          {user.role !== "client" && <option value="admin">Admin</option>}
                          <option value="edit">Can edit</option>
                          <option value="comment">Can comment</option>
                          <option value="view">Can view</option>
                        </select>

                        <div className="flex items-center gap-1.5">
                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={cn(
                              "p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                              link.status === "active"
                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                : "border-muted-foreground/20 bg-muted/10 text-muted-foreground hover:bg-muted-foreground/10"
                            )}
                            title={link.status === "active" ? "Disable Link" : "Enable Link"}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          {/* Regenerate Link */}
                          <button
                            onClick={() => handleRegenerateLink(link)}
                            className="p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                            title="Regenerate Link"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>

                          {/* Remove Access */}
                          <button
                            onClick={() => handleRemoveAccess(link)}
                            className="p-1.5 h-8.5 w-8.5 inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Remove Access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppDialog>
  );
}



function ProjectSettingsModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projectId = payload?.projectId as string;
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const clients = useStore((s) => s.clients);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { busy, run } = useAsyncAction();

  const [form, setForm] = useState(() => {
    if (!project) return {
      name: "",
      description: "",
      clientId: "",
      status: "planning" as const,
      startDate: "",
      endDate: "",
    };
    return {
      name: project.name,
      description: project.description,
      clientId: project.clientId,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    };
  });

  if (!project) return null;

  const handleSave = async () => {
    await run(() => {
      updateProject(project.id, {
        name: form.name,
        description: form.description,
        clientId: form.clientId,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
      });
    }, "Settings saved successfully");
    close();
  };

  const handleArchive = async () => {
    await run(() => {
      updateProject(project.id, { status: "on_hold" });
    }, "Project archived");
    close();
  };

  const handleDelete = async () => {
    await run(() => {
      deleteProject(project.id);
      window.location.href = `/owner/projects`;
    }, "Project deleted");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit project"
      description="Configure workspace variables, timeline, status and client properties."
      icon={<Edit2 className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground truncate max-w-xs">
            Changes apply to project: <span className="font-semibold text-foreground">{project.name}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton onClick={handleSave} loading={busy}>
              Save Changes
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Project Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
            Project Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-foreground"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
            Description
          </label>
          <RichEditor
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
            minHeight={120}
            placeholder="Describe your project, goals, key milestones..."
          />
        </div>

        {/* Client & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
              Client
            </label>
            <div className="relative">
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="h-11 w-full rounded-2xl border border-border bg-background px-4 pr-10 text-sm font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all cursor-pointer text-foreground"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/80">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
              Project Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="h-11 w-full rounded-2xl border border-border bg-background px-4 pr-10 text-sm font-medium text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all cursor-pointer text-foreground"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/80">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Start & End Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-foreground"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 block mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all text-foreground"
            />
          </div>
        </div>

        {/* Project Actions (formerly Danger Zone) */}
        <div className="border-t border-border/60 pt-5 mt-6 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Project Actions
          </div>

          <div className="space-y-3">
            {/* Archive Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-muted/10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground">Archive Project</div>
                <p className="text-[10px] text-muted-foreground max-w-md leading-relaxed">
                  Move project to On Hold. Hides it from active dashboards but retains all data. You can restore it anytime.
                </p>
              </div>

              <div className="shrink-0 sm:ml-4">
                {confirmArchive ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmArchive(false)}
                      className="h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmArchive(true)}
                    className="h-9 px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
                  >
                    Archive Project
                  </button>
                )}
              </div>
            </div>

            {/* Delete Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-muted/10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground">Delete Project</div>
                <p className="text-[10px] text-muted-foreground max-w-md leading-relaxed">
                  Permanently delete this project and all associated tasks, files, and comments. This action cannot be undone.
                </p>
              </div>

              <div className="shrink-0 sm:ml-4">
                {confirmDelete ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-9 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Delete Project
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

/* ─────────────────────────── Registry ─────────────────────────── */

const REGISTRY: Record<ModalKey, React.FC<{ close: () => void; payload?: ModalPayload }>> = {
  "project.new": NewProjectModal,
  "project.edit": EditProjectModal,
  "project.share": ShareProjectModal,
  "project.settings": ProjectSettingsModal,
  "project.archive": ArchiveProjectModal,
  "project.status": ProjectStatusModal,
  "project.delete": DeleteProjectModal,

  "client.new": NewClientModal,
  "client.edit": EditClientModal,
  "client.archive": ArchiveClientModal,
  "client.delete": DeleteClientModal,
  "client.status": ClientStatusModal,
  "client.share": ShareClientModal,
  "client.invite": InviteClientModal,
  "client.settings": ClientSettingsModal,

  "task.new": NewTaskModal,
  "task.edit": EditTaskModal,
  "task.delete": DeleteTaskModal,
  "task.assign": AssignTaskModal,
  "task.status": TaskStatusModal,
  "task.priority": TaskPriorityModal,

  "request.new": NewRequestModal,
  "request.review": ReviewRequestModal,
  "request.approve": ApproveRequestModal,
  "request.reject": RejectRequestModal,
  "request.convertTask": ConvertRequestToTaskModal,
  "request.convertProject": ConvertRequestToProjectModal,


  "doc.upload": UploadDocumentModal,
  "doc.folder.new": NewFolderModal,
  "doc.folder.rename": RenameFolderModal,
  "doc.folder.delete": DeleteFolderModal,
  "doc.rename": RenameFileModal,
  "doc.move": MoveFileModal,
  "doc.delete": DeleteFileModal,
  "project.storage.connect": ConnectProjectStorageModal,

  "team.add": AddMemberModal,
  "team.edit": EditMemberModal,
  "team.remove": RemoveMemberModal,

  "time.log": LogTimeModal,
  "time.edit": EditTimeModal,
  "time.delete": DeleteTimeModal,

  "ai.review": AIReviewModal,
  "ai.confirm": AIConfirmModal,
};

/* keep unused imports referenced to satisfy bundler tree-shake quiet */
void useEffect;
