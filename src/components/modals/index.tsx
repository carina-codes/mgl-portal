/**
 * Modals — central modal system for the MGL Portal.
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
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  AppDialog,
  FieldGroup,
  FieldLabel,
  TextField,
  SelectField,
} from "@/components/ui/app-dialog";
import { FormattedBody } from "@/components/formatted-body";
import { cn } from "@/lib/utils";
import { formatDateLong, formatDateShort, toDateInputValue } from "@/lib/dates";
import { DateInput } from "@/components/ui/date-input";
import { RichEditor } from "@/components/rich-editor";
import { useStore, isProjectMember } from "@/lib/store";
import { TIMEZONE_OPTIONS, detectTimezone } from "@/lib/timezones";
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
  ListPlus,
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
  | "request.close"
  | "request.convert"
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
  const team = useStore((s) => s.users).filter((u) => u.role === "owner" || u.role === "manager");
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
      () =>
        createProject({
          ...form,
          startDate: form.startDate ? formatDateLong(form.startDate) : undefined,
          endDate: form.endDate ? formatDateLong(form.endDate) : undefined,
          lead: form.lead || form.team[0],
        }),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="retainer">Retainer</option>
            </SelectField>
          </div>
        </div>

        {/* Section 2: Parameters (Timeline & Budget) */}
        <div className="border-t border-border/50 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <TextField
                  label="Due date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            );
          })()}
        </div>

        {/* Section 3: Management */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Management</span>
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
  const teamUsers = useStore((s) => s.users).filter((u) => u.role === "owner" || u.role === "manager");
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const { busy, run } = useAsyncAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => ({
    name: project?.name ?? "",
    clientId: project?.clientId ?? "",
    type: project?.type ?? "fixed",
    description: project?.description ?? "",
    budget: project?.budget ?? 0,
    hoursEstimate: project?.hoursEstimate ?? 0,
    endDate: toDateInputValue(project?.endDate),
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

  const originalEndDate = project.endDate;

  async function submit() {
    await run(
      () => updateProject(projectId, { ...form, endDate: form.endDate ? formatDateLong(form.endDate) : originalEndDate }),
      "Project updated",
    );
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
        <div className="flex w-full justify-between items-center">
          <div>
            <button
              type="button"
              onClick={async () => {
                if (confirmDelete) {
                  await run(() => deleteProject(projectId), `${project.name} deleted`);
                  close();
                } else {
                  setConfirmDelete(true);
                }
              }}
              className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              {confirmDelete ? "Confirm Delete" : "Delete Project"}
            </button>
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={() => { setConfirmDelete(false); close(); }}>Cancel</GhostButton>
            <PrimaryButton onClick={submit} loading={busy}>Save changes</PrimaryButton>
          </div>
        </div>
      }
    >
      <FieldGroup className="space-y-6">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <TextField label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <SelectField
              label="Engagement type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "hourly" | "retainer" })}
            >
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="retainer">Retainer</option>
            </SelectField>
          </div>
        </div>

        {/* Section 2: Parameters (Timeline & Budget) */}
        <div className="border-t border-border/50 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Timeline & Budget Settings</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField label={budgetLabel} type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            <TextField label={hoursLabel} type="number" value={form.hoursEstimate} onChange={(e) => setForm({ ...form, hoursEstimate: Number(e.target.value) })} />
            <TextField label="Due date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>

        {/* Section 3: Management */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Management</span>
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
  const [form, setForm] = useState(() => ({
    name: "",
    industry: "",
    subIndustry: "",
    logoColor: "#0049FE",
    logoUrl: "",
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
    timezone: detectTimezone(),
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
    facebook: "",
    status: "active" as "active" | "paused",
    health: "healthy" as const,
    retainer: "Project" as const,
    businessEmail: "",
    zipCode: "",
  }));

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const [additionalContacts, setAdditionalContacts] = useState<any[]>([]);
  const [shortcuts, setShortcuts] = useState<Array<{ name: string; link: string; displayInDropdown: boolean }>>([]);

  const addContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { name: "", title: "", email: "", phone: "", department: "" }
    ]);
  };

  const updateContact = (index: number, key: string, val: string) => {
    const next = [...additionalContacts];
    next[index] = { ...next[index], [key]: val };
    setAdditionalContacts(next);
  };

  const removeContact = (index: number) => {
    setAdditionalContacts(additionalContacts.filter((_, i) => i !== index));
  };

  const addShortcut = () => {
    setShortcuts([...shortcuts, { name: "", link: "", displayInDropdown: false }]);
  };

  const updateShortcut = (index: number, key: string, val: any) => {
    const next = [...shortcuts];
    next[index] = { ...next[index], [key]: val };
    setShortcuts(next);
  };

  const removeShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const valid = form.name && form.contactEmail.includes("@");

  const handleSubmit = async () => {
    const tags = form.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const socialLinks = {
      linkedin: form.linkedin,
      instagram: form.instagram,
      twitter: form.twitter,
      facebook: form.facebook,
    };
    
    await run(() => create({
      ...form,
      tags,
      socialLinks,
      additionalContacts,
      shortcuts,
    }), "Client added — an invite email is on its way to their contact");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={
        <div>
          <div className="text-lg font-semibold tracking-tight">New client</div>
          <div className="text-sm text-muted-foreground font-normal">Add a client workspace with rich profile attributes.</div>
        </div>
      }
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div className="text-xs text-muted-foreground">
            * Business Name and Contact Email are required.
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
      <div className="space-y-6">
        {/* Brand Identity Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Identity</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <FieldLabel>Workspace Color</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="relative h-11 w-11 rounded-full border border-border overflow-hidden cursor-pointer shadow-sm shrink-0">
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="absolute inset-0 h-[200%] w-[200%] -translate-x-[25%] -translate-y-[25%] cursor-pointer border-0 p-0 rounded-full"
                  />
                </div>
                <input
                  value={form.logoColor}
                  onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                  className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm uppercase text-foreground focus:outline-none"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Workspace Logo</FieldLabel>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoFileChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => logoInputRef.current?.click()}
                className="h-11 rounded-2xl border border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 px-3 overflow-hidden text-xs text-muted-foreground"
              >
                {form.logoUrl ? (
                  <div className="flex items-center gap-2 w-full">
                    <img src={form.logoUrl} alt="Logo" className="h-6 w-6 rounded-lg object-cover border border-border shrink-0" />
                    <span className="truncate text-foreground font-medium flex-1 text-left">Logo uploaded</span>
                    <span className="text-[10px] text-primary font-bold">Replace</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5 text-muted-foreground/75" />
                    <span>Drag or click to upload</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Industry section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Industry</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Industry" placeholder="SaaS · DTC · Brand" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <TextField label="Sub Industry" placeholder="B2B · E-Commerce" value={form.subIndustry} onChange={(e) => setForm({ ...form, subIndustry: e.target.value })} />
          </div>
        </div>

        {/* Contact details section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Contact Name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <TextField label="Contact Position / Role" placeholder="CMO / VP Marketing" value={form.contactRole} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Contact Email *" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <TextField label="Contact Phone" placeholder="+1 (555) 012-3457" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>

          {/* Dynamic Contacts (Add More) */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">Additional Contacts</span>
              <button
                type="button"
                onClick={addContact}
                className="text-xs font-bold text-primary cursor-pointer"
              >
                + Add Contact
              </button>
            </div>
            {additionalContacts.map((contact, idx) => (
              <div key={idx} className="relative p-4 rounded-2xl border border-border/50 bg-muted/10 space-y-3">
                <button
                  type="button"
                  onClick={() => removeContact(idx)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Name"
                    value={contact.name}
                    onChange={(e) => updateContact(idx, "name", e.target.value)}
                  />
                  <TextField
                    label="Title / Role"
                    value={contact.title}
                    onChange={(e) => updateContact(idx, "title", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(idx, "email", e.target.value)}
                  />
                  <TextField
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, "phone", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business details section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Business Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Business Phone" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Business Email" type="email" value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} />
            <TextField label="Working Hours" placeholder="9:00 AM - 5:00 PM EST" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
          </div>
          <div className="space-y-3">
            <TextField label="Business Address" placeholder="e.g. 100 Broadway, 24th Floor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="City" placeholder="New York" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State" placeholder="NY" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Zip Code" placeholder="10005" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
              <SelectField label="Time Zone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                {!TIMEZONE_OPTIONS.some((t) => t.tz === form.timezone) && (
                  <option value={form.timezone}>{form.timezone}</option>
                )}
                {TIMEZONE_OPTIONS.map((t) => (
                  <option key={t.tz} value={t.tz}>{t.label}</option>
                ))}
              </SelectField>
            </div>
          </div>
          <div>
            <FieldLabel>Business Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Core business, client biography..."
              className="h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
            />
          </div>
        </div>

        {/* Web presence & social links section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Online Presence</h4>
          <TextField label="Website URL" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="LinkedIn URL" placeholder="https://linkedin.com/company/..." value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            <TextField label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Twitter / X URL" placeholder="https://x.com/..." value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
            <TextField label="Facebook URL" placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          </div>
        </div>

        {/* Internal Notes Section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
          <div>
            <RichEditor value={form.internalNotes} onChange={(v) => setForm({ ...form, internalNotes: v })} minHeight={120} />
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</h4>
            <button
              type="button"
              onClick={addShortcut}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              + Add Shortcut
            </button>
          </div>
          {shortcuts.map((sh, idx) => (
            <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10 relative">
              <button
                type="button"
                onClick={() => removeShortcut(idx)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <TextField
                  label="Shortcut Name"
                  placeholder="e.g. Google Drive"
                  value={sh.name}
                  onChange={(e) => updateShortcut(idx, "name", e.target.value)}
                />
                <TextField
                  label="Shortcut Link"
                  placeholder="https://..."
                  value={sh.link}
                  onChange={(e) => updateShortcut(idx, "link", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppDialog>
  );
}

function EditClientModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.clientId as string;
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const update = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const { busy, run } = useAsyncAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [form, setForm] = useState(() => ({
    name: client?.name ?? "",
    industry: client?.industry ?? "",
    subIndustry: client?.subIndustry ?? "",
    logoColor: client?.logoColor ?? "#0049FE",
    logoUrl: client?.logoUrl ?? "",
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
    facebook: client?.socialLinks?.facebook ?? "",
    status: client?.status ?? "active",
    health: client?.health ?? "healthy",
    retainer: client?.retainer ?? "Project",
    businessEmail: client?.businessEmail ?? client?.contactEmail ?? "",
    zipCode: client?.zipCode ?? "",
  }));

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const [additionalContacts, setAdditionalContacts] = useState(() => client?.additionalContacts || []);
  const [shortcuts, setShortcuts] = useState<Array<{ name: string; link: string; displayInDropdown: boolean }>>(() => client?.shortcuts || []);
  const resendInvite = useStore((s) => s.resendClientInvite);
  const { busy: resendBusy, run: runResend } = useAsyncAction();

  if (!client) return null;

  const addContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { name: "", title: "", email: "", phone: "", department: "" }
    ]);
  };

  const updateContact = (index: number, key: string, val: string) => {
    const next = [...additionalContacts];
    next[index] = { ...next[index], [key]: val };
    setAdditionalContacts(next);
  };

  const removeContact = (index: number) => {
    setAdditionalContacts(additionalContacts.filter((_, i) => i !== index));
  };

  const addShortcut = () => {
    setShortcuts([...shortcuts, { name: "", link: "", displayInDropdown: false }]);
  };

  const updateShortcut = (index: number, key: string, val: any) => {
    const next = [...shortcuts];
    next[index] = { ...next[index], [key]: val };
    setShortcuts(next);
  };

  const removeShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const tags = form.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const socialLinks = {
      linkedin: form.linkedin,
      instagram: form.instagram,
      twitter: form.twitter,
      facebook: form.facebook,
    };

    await run(() => update(id, {
      ...form,
      tags,
      socialLinks,
      additionalContacts,
      shortcuts,
    }), "Client updated");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={
        <div>
          <div className="text-lg font-semibold tracking-tight">Edit client</div>
          <div className="text-sm text-muted-foreground font-normal">View and manage client workspace profile attributes.</div>
        </div>
      }
      icon={<UserCog className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div>
            <button
              type="button"
              onClick={async () => {
                if (confirmDelete) {
                  await run(() => deleteClient(id), `${client.name} deleted`);
                  close();
                } else {
                  setConfirmDelete(true);
                }
              }}
              className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              {confirmDelete ? "Confirm Delete" : "Delete Client"}
            </button>
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={() => { setConfirmDelete(false); close(); }}>Cancel</GhostButton>
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
      <div className="space-y-6">
        {/* Portal access section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Portal Access</h4>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{client.contact}</div>
              <div className="text-xs text-muted-foreground truncate">{client.contactEmail}</div>
            </div>
            <button
              type="button"
              disabled={resendBusy}
              onClick={() =>
                runResend(() => resendInvite(client.id), `Invite email resent to ${client.contactEmail}`)
              }
              className="shrink-0 h-9 px-3.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer disabled:opacity-60"
            >
              Resend invite email
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Sends a fresh one-time sign-in link to the contact's email — useful if their first invite expired or got lost.
          </p>
        </div>

        {/* Brand Identity Section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Identity</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <FieldLabel>Workspace Color</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="relative h-11 w-11 rounded-full border border-border overflow-hidden cursor-pointer shadow-sm shrink-0">
                  <input
                    type="color"
                    value={form.logoColor}
                    onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                    className="absolute inset-0 h-[200%] w-[200%] -translate-x-[25%] -translate-y-[25%] cursor-pointer border-0 p-0 rounded-full"
                  />
                </div>
                <input
                  value={form.logoColor}
                  onChange={(e) => setForm({ ...form, logoColor: e.target.value })}
                  className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-sm uppercase text-foreground focus:outline-none"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Workspace Logo</FieldLabel>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoFileChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => logoInputRef.current?.click()}
                className="h-11 rounded-2xl border border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 px-3 overflow-hidden text-xs text-muted-foreground"
              >
                {form.logoUrl ? (
                  <div className="flex items-center gap-2 w-full">
                    <img src={form.logoUrl} alt="Logo" className="h-6 w-6 rounded-lg object-cover border border-border shrink-0" />
                    <span className="truncate text-foreground font-medium flex-1 text-left">Logo uploaded</span>
                    <span className="text-[10px] text-primary font-bold">Replace</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5 text-muted-foreground/75" />
                    <span>Drag or click to upload</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Industry section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Industry</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Industry" placeholder="SaaS · DTC · Brand" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <TextField label="Sub Industry" placeholder="B2B · E-Commerce" value={form.subIndustry} onChange={(e) => setForm({ ...form, subIndustry: e.target.value })} />
          </div>
        </div>

        {/* Contact details section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Contact Name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <TextField label="Contact Position / Role" placeholder="CMO / VP Marketing" value={form.contactRole} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <TextField label="Contact Phone" placeholder="+1 (555) 012-3457" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>

          {/* Dynamic Contacts (Add More) */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">Additional Contacts</span>
              <button
                type="button"
                onClick={addContact}
                className="text-xs font-bold text-primary cursor-pointer"
              >
                + Add Contact
              </button>
            </div>
            {additionalContacts.map((contact, idx) => (
              <div key={idx} className="relative p-4 rounded-2xl border border-border/50 bg-muted/10 space-y-3">
                <button
                  type="button"
                  onClick={() => removeContact(idx)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Name"
                    value={contact.name}
                    onChange={(e) => updateContact(idx, "name", e.target.value)}
                  />
                  <TextField
                    label="Title / Role"
                    value={contact.title}
                    onChange={(e) => updateContact(idx, "title", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(idx, "email", e.target.value)}
                  />
                  <TextField
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, "phone", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business details section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Business Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Business Phone" placeholder="+1 (555) 012-3456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Business Email" type="email" value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} />
            <TextField label="Working Hours" placeholder="9:00 AM - 5:00 PM EST" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
          </div>
          <div className="space-y-3">
            <TextField label="Business Address" placeholder="e.g. 100 Broadway, 24th Floor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="City" placeholder="New York" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State" placeholder="NY" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Zip Code" placeholder="10005" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
              <SelectField label="Time Zone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                {!TIMEZONE_OPTIONS.some((t) => t.tz === form.timezone) && (
                  <option value={form.timezone}>{form.timezone}</option>
                )}
                {TIMEZONE_OPTIONS.map((t) => (
                  <option key={t.tz} value={t.tz}>{t.label}</option>
                ))}
              </SelectField>
            </div>
          </div>
          <div>
            <FieldLabel>Business Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Core business, client biography..."
              className="h-20 w-full rounded-2xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
            />
          </div>
        </div>

        {/* Web presence & social links section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Online Presence</h4>
          <TextField label="Website URL" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="LinkedIn URL" placeholder="https://linkedin.com/company/..." value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            <TextField label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Twitter / X URL" placeholder="https://x.com/..." value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
            <TextField label="Facebook URL" placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          </div>
        </div>

        {/* Internal Notes Section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
          <div>
            <RichEditor value={form.internalNotes} onChange={(v) => setForm({ ...form, internalNotes: v })} minHeight={120} />
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</h4>
            <button
              type="button"
              onClick={addShortcut}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              + Add Shortcut
            </button>
          </div>
          {shortcuts.map((sh, idx) => (
            <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10 relative">
              <button
                type="button"
                onClick={() => removeShortcut(idx)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <TextField
                  label="Shortcut Name"
                  placeholder="e.g. Google Drive"
                  value={sh.name}
                  onChange={(e) => updateShortcut(idx, "name", e.target.value)}
                />
                <TextField
                  label="Shortcut Link"
                  placeholder="https://..."
                  value={sh.link}
                  onChange={(e) => updateShortcut(idx, "link", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
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
  const inviteContact = useStore((s) => s.inviteClientContact);
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
      // Gives this contact their own real portal login (separate profile,
      // same client_id) — not just an entry in the read-only contacts list.
      await inviteContact(client.id, form.name, form.email);
      await updateClient(client.id, { additionalContacts: updatedContacts });
    }, "Invite sent");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Full Name" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <TextField label="Email Address" type="email" placeholder="e.g. john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  });
  const valid = form.title.trim().length > 1 && !!form.projectId;

  const [customTemplates, setCustomTemplates] = useState<Array<{
    label: string;
    title: string;
    note: string;
    estimatedHours: number;
    priority: Priority;
    tagsInput: string;
  }>>([]);

  const [templateName, setTemplateName] = useState("");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [hiddenTemplates, setHiddenTemplates] = useState<string[]>([]);

  const currentProject = projects.find((p) => p.id === form.projectId);
  const isRetainer = currentProject?.type === "retainer";

  const staticTemplates = isRetainer
    ? [
        {
          label: "Monthly Maintenance",
          title: "Monthly Maintenance Support",
          note: "<p>Perform monthly system maintenance: update dependencies, check error logs, run backups, and verify server health metrics.</p>",
          estimatedHours: 10,
          priority: "medium" as Priority,
          tagsInput: "Maintenance, Retainer",
        },
        {
          label: "Security Audit",
          title: "Monthly Security & Dependency Audit",
          note: "<p>Perform security sweep, run audit on dependencies, and check for vulnerability disclosures.</p>",
          estimatedHours: 8,
          priority: "high" as Priority,
          tagsInput: "Security, Audit",
        },
        {
          label: "Performance Optimization",
          title: "Performance & Database Optimization",
          note: "<p>Analyze database query speeds, clean index fragmentation, and review cache hit ratios.</p>",
          estimatedHours: 12,
          priority: "medium" as Priority,
          tagsInput: "Performance, Database",
        },
        {
          label: "SLA Reporting",
          title: "Monthly Retainer SLA Reporting",
          note: "<p>Generate monthly SLA performance report, compile response/resolution times, and send report to client.</p>",
          estimatedHours: 4,
          priority: "low" as Priority,
          tagsInput: "Report, SLA",
        },
      ]
    : [
        {
          label: "Design Review",
          title: "Design Review & Critique Sprint",
          note: "<p>Review current UI/UX layout sprints, collect team feedback, and document action items.</p>",
          estimatedHours: 4,
          priority: "medium" as Priority,
          tagsInput: "Design, Review",
        },
        {
          label: "Bug Sweep",
          title: "Weekly Bug Sweep & Fixes",
          note: "<p>Audit open issues, prioritize critical bugs, and patch them on local & staging environments.</p>",
          estimatedHours: 6,
          priority: "high" as Priority,
          tagsInput: "Bug, Patch",
        },
        {
          label: "Staging Deploy",
          title: "Prepare Release & Deploy to Staging",
          note: "<p>Merge latest release branches, run integration tests, and deploy builds to staging.</p>",
          estimatedHours: 2,
          priority: "medium" as Priority,
          tagsInput: "Release, Deploy",
        },
      ];

  const templates = [
    ...staticTemplates.filter((st) => !customTemplates.some((ct) => ct.label === st.label)),
    ...customTemplates
  ].filter((t) => !hiddenTemplates.includes(t.label));

  const handleSubmit = async () => {
    if (!valid) return;
    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await run(
      () =>
        create({
          projectId: form.projectId,
          title: form.title,
          note: form.note,
          stage: form.stage,
          priority: form.priority,
          dueDate: form.dueDate ? formatDateShort(form.dueDate) : "",
          startDate: form.startDate,
          estimatedHours: form.estimatedHours,
          tags,
          followers: form.followers,
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
        <div className="space-y-3">
          <SelectField
            label="Template"
            value={selectedTemplate}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTemplate(val);
              if (!val) return;
              if (val === "__create_template__") {
                setIsCreatingTemplate(true);
                setSelectedTemplate("");
                return;
              }
              const tpl = templates.find((t) => t.label === val);
              if (tpl) {
                setForm((f) => ({
                  ...f,
                  title: tpl.title,
                  note: tpl.note,
                  estimatedHours: tpl.estimatedHours,
                  priority: tpl.priority,
                  tagsInput: tpl.tagsInput,
                }));
                toast.success(`Applied template: ${tpl.label}`);
              }
            }}
          >
            <option value="">Select a template...</option>
            {templates.map((tpl) => (
              <option key={tpl.label} value={tpl.label}>
                {tpl.label}
              </option>
            ))}
            <option value="__create_template__" className="text-primary font-semibold">+ Create a template</option>
          </SelectField>

          {selectedTemplate && (
            <div className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/40 p-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-muted-foreground font-medium pl-1">
                Active template: <strong className="text-foreground">{selectedTemplate}</strong>
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const name = selectedTemplate;
                    const isCustom = customTemplates.some((t) => t.label === name);
                    if (isCustom) {
                      setCustomTemplates((prev) =>
                        prev.map((t) =>
                          t.label === name
                            ? {
                                ...t,
                                title: form.title,
                                note: form.note,
                                estimatedHours: form.estimatedHours,
                                priority: form.priority,
                                tagsInput: form.tagsInput,
                              }
                            : t
                        )
                      );
                    } else {
                      const newTpl = {
                        label: name,
                        title: form.title,
                        note: form.note,
                        estimatedHours: form.estimatedHours,
                        priority: form.priority,
                        tagsInput: form.tagsInput,
                      };
                      setCustomTemplates((prev) => [...prev, newTpl]);
                    }
                    toast.success(`Template "${name}" updated!`);
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                  title="Overwrite this template with current form inputs"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const name = selectedTemplate;
                    const isCustom = customTemplates.some((t) => t.label === name);
                    const isStatic = staticTemplates.some((t) => t.label === name);
                    if (isCustom) {
                      setCustomTemplates((prev) => prev.filter((t) => t.label !== name));
                    }
                    if (isStatic) {
                      setHiddenTemplates((prev) => [...prev, name]);
                    }
                    toast.success(`Template "${name}" deleted!`);
                    setSelectedTemplate("");
                  }}
                  className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {isCreatingTemplate && (
            <div className="flex items-end gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex-1">
                <TextField
                  label="New Template Name"
                  placeholder="e.g. QA Check"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-1.5 h-10 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!templateName.trim()) {
                      toast.error("Please enter a template name");
                      return;
                    }
                    const newTpl = {
                      label: templateName.trim(),
                      title: form.title,
                      note: form.note,
                      estimatedHours: form.estimatedHours,
                      priority: form.priority,
                      tagsInput: form.tagsInput,
                    };
                    setCustomTemplates((prev) => [...prev, newTpl]);
                    toast.success(`Template "${templateName}" saved!`);
                    setTemplateName("");
                    setIsCreatingTemplate(false);
                  }}
                  className="rounded-xl bg-primary px-3 h-9 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateName("");
                    setIsCreatingTemplate(false);
                  }}
                  className="rounded-xl border border-border bg-background px-3 h-9 text-xs font-semibold text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <TextField
          label="Title"
          placeholder="e.g. Polish hero animation"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div>
          <FieldLabel>Assignees</FieldLabel>
          <MultiUserPicker
            users={team}
            selected={form.assignees}
            onChange={(assignees) => setForm({ ...form, assignees })}
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor
            value={form.note}
            onChange={(v) => setForm({ ...form, note: v })}
            placeholder="Context, links, @mentions…"
            minHeight={100}
          />
        </div>

        <div>
          <TextField
            label="Tags"
            placeholder="e.g. Design, Frontend (comma-separated)"
            value={form.tagsInput}
            onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <TextField label="Due date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
    priority: "medium" as Priority,
  });
  const valid = form.title.trim().length > 1 && !!form.clientId;
  const clientProjects = projects.filter((p) => p.clientId === form.clientId);

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="New request"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Project (optional)" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">— None —</option>
            {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
        </div>

        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summarize the ask" />
        <div>
          <FieldLabel>Details</FieldLabel>
          <RichEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Context, references, success criteria…" minHeight={140} />
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
          <GhostButton onClick={close} className="mr-auto">Cancel</GhostButton>
          <button
            onClick={() => open("request.convert", { requestId: id })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" /> Convert
          </button>
          <button
            onClick={() => open("request.close", { requestId: id })}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            <XCircle className="h-3.5 w-3.5" /> Close
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
          <FormattedBody html={req.description} />
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

function CloseRequestModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const setStatus = useStore((s) => s.setRequestStatus);
  const [reason, setReason] = useState("");
  const { busy, run } = useAsyncAction();
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Close request"
      description="Let the client know why so we can keep the relationship strong."
      icon={<XCircle className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <DangerButton
            loading={busy}
            onClick={async () => {
              if (!reason.trim()) return toast.error("Add a short reason before closing.");
              await run(() => setStatus(id, "closed"), "Request closed");
              close();
            }}
          >
            Close request
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

function ConvertRequestChoiceModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const { open } = useModals();
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Convert Request"
      description="Choose whether to convert this request into an individual task or a new project."
      icon={<ArrowRightLeft className="h-5 w-5" />}
      size="md"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
        <button
          onClick={() => {
            close();
            open("request.convertTask", { requestId: id });
          }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/85 bg-card hover:bg-muted/45 p-6 text-center cursor-pointer transition-all hover:scale-[1.02] text-foreground"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListPlus className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-sm">Task</div>
            <div className="text-[11px] text-muted-foreground mt-1">Add to an existing project</div>
          </div>
        </button>

        <button
          onClick={() => {
            close();
            open("request.convertProject", { requestId: id });
          }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/85 bg-card hover:bg-muted/45 p-6 text-center cursor-pointer transition-all hover:scale-[1.02] text-foreground"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <FolderPlus className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-sm">Project</div>
            <div className="text-[11px] text-muted-foreground mt-1">Initialize a new project</div>
          </div>
        </button>
      </div>
      <div className="flex justify-end mt-4">
        <GhostButton onClick={close}>Cancel</GhostButton>
      </div>
    </AppDialog>
  );
}

function ConvertRequestToTaskModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const projects = useStore((s) => s.projects).filter((p) => p.clientId === req?.clientId);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const convert = useStore((s) => s.convertRequestToTask);
  const { busy, run } = useAsyncAction();

  const [form, setForm] = useState(() => ({
    title: req?.title ?? "",
    description: req?.description ?? "",
    projectId: projects[0]?.id ?? "",
    stage: "todo" as TaskStage,
    priority: (req?.priority ?? "medium") as Priority,
    dueDate: "",
    startDate: "",
    estimatedHours: req?.estimatedHours ?? 0,
    assignees: [] as string[],
  }));

  if (!req) return null;

  const valid = form.title.trim().length > 1 && !!form.projectId;

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Convert request to task"
      description="Review the details and add this work to a project."
      icon={<ArrowRightLeft className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => {
              await run(
                () =>
                  convert(id, form.projectId, {
                    title: form.title,
                    note: form.description,
                    stage: form.stage,
                    priority: form.priority,
                    dueDate: form.dueDate ? formatDateShort(form.dueDate) : "",
                    startDate: form.startDate,
                    estimatedHours: form.estimatedHours,
                    assignees: form.assignees,
                  }),
                "Converted to task",
              );
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

        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <SelectField label="Add to project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
          {projects.length === 0 && <option value="">No projects for this client</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <TextField
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>

        <TextField
          label="Estimated Hours"
          type="number"
          value={form.estimatedHours || ""}
          onChange={(e) => setForm({ ...form, estimatedHours: parseFloat(e.target.value) || 0 })}
        />

        <div>
          <FieldLabel>Assignees</FieldLabel>
          <div className="rounded-xl border border-border bg-background p-2 max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
            {team.map((m) => {
              const assigned = form.assignees.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all p-1.5 rounded-lg hover:bg-muted/60",
                    assigned ? "text-primary bg-primary/5" : "text-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={() => {
                      const next = assigned
                        ? form.assignees.filter((mid) => mid !== m.id)
                        : [...form.assignees, m.id];
                      setForm({ ...form, assignees: next });
                    }}
                    className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                  />
                  <UserAvatar user={m} size={20} />
                  <span className="truncate">{m.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Context, links, @mentions…"
            minHeight={100}
          />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ConvertRequestToProjectModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.requestId as string;
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const clients = useStore((s) => s.clients);
  const client = useMemo(() => clients.find((c) => c.id === req?.clientId), [clients, req?.clientId]);
  const convert = useStore((s) => s.convertRequestToProject);
  // Mirrors New Project: only the owner and managers show up as candidates
  // for Management — regular team members connect via task assignment.
  const managementUsers = useStore((s) => s.users).filter((u) => u.role === "owner" || u.role === "manager");
  const { busy, run } = useAsyncAction();

  const [form, setForm] = useState(() => ({
    name: req?.title ?? "",
    description: req?.description ?? "",
    type: "fixed" as "fixed" | "hourly" | "retainer",
    budget: 15000,
    hoursEstimate: 80,
    endDate: "",
    team: [] as string[],
    lead: "",
  }));

  if (!req) return null;

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
              await run(
                () =>
                  convert(id, {
                    ...form,
                    endDate: form.endDate ? formatDateLong(form.endDate) : undefined,
                    lead: form.lead || form.team[0],
                  }),
                "Project created from request",
              );
              close();
            }}
          >
            Create project
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup className="space-y-6">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <TextField label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Client</FieldLabel>
              <div className="mt-1 flex items-center rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {client?.name ?? "—"}
              </div>
            </div>
            <SelectField
              label="Engagement type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "hourly" | "retainer" })}
            >
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="retainer">Retainer</option>
            </SelectField>
          </div>
        </div>

        {/* Section 2: Timeline & Budget */}
        <div className="border-t border-border/50 pt-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Timeline & Budget Settings</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <TextField
              label="Due date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Section 3: Management */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Management</span>
          </div>
          <MultiUserPicker
            users={managementUsers}
            selected={form.team}
            onChange={(team) => setForm({ ...form, team })}
          />
        </div>

        {/* Section 4: Brief */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

/* ─────────────────────────── Modals: Documents ─────────────────────────── */

function UploadDocumentModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const allProjects = useStore((s) => s.projects);
  const projects = useMemo(() => {
    if (payload?.clientId) {
      return allProjects.filter((p) => p.clientId === payload.clientId);
    }
    return allProjects;
  }, [allProjects, payload?.clientId]);

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
      title="Upload file"
      icon={<Upload className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!form.name.trim()}
            onClick={async () => { await run(() => upload(form), "File uploaded"); close(); }}
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
        {!payload?.projectId ? (
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
        ) : null}
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
            placeholder="e.g. storage@mgl-portal-brand.com"
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
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "Designer",
    role: "team" as "team" | "owner" | "manager",
    city: "",
    state: "",
    zipCode: "",
    address: "",
    financialType: "hourly",
    financialAmount: 75,
    internalNotes: "",
    phone: "",
    timezone: "America/Los_Angeles",
  });

  const [shortcuts, setShortcuts] = useState<Array<{ name: string; link: string }>>([]);

  const valid = form.name && form.email.includes("@");

  const addShortcut = () => {
    setShortcuts([...shortcuts, { name: "", link: "" }]);
  };

  const updateShortcut = (index: number, key: string, val: string) => {
    const next = [...shortcuts];
    next[index] = { ...next[index], [key]: val };
    setShortcuts(next);
  };

  const removeShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={
        <div>
          <div className="text-lg font-semibold tracking-tight">New team member</div>
          <div className="text-sm text-muted-foreground font-normal">Add a new member to the agency team workspace.</div>
        </div>
      }
      icon={<UserPlus className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => {
              await run(() => add({ ...form, shortcuts }), "Member added");
              close();
            }}
          >
            Add member
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Info Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Info</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="team">Team</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</h4>
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <TextField label="Zip Code" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
          </div>
        </div>

        {/* Financials Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financials</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Type" value={form.financialType} onChange={(e) => setForm({ ...form, financialType: e.target.value })}>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
              <option value="contract">Contract</option>
              <option value="retainer">Retainer</option>
            </SelectField>
            <TextField label="Amount ($)" type="number" value={form.financialAmount.toString()} onChange={(e) => setForm({ ...form, financialAmount: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
          <div>
            <RichEditor value={form.internalNotes} onChange={(v) => setForm({ ...form, internalNotes: v })} minHeight={120} />
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</h4>
            <button
              type="button"
              onClick={addShortcut}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              + Add Shortcut
            </button>
          </div>
          {shortcuts.map((sh, idx) => (
            <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10 relative">
              <button
                type="button"
                onClick={() => removeShortcut(idx)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <TextField
                  label="Shortcut Name"
                  placeholder="e.g. Wiki"
                  value={sh.name}
                  onChange={(e) => updateShortcut(idx, "name", e.target.value)}
                />
                <TextField
                  label="Shortcut Link"
                  placeholder="https://..."
                  value={sh.link}
                  onChange={(e) => updateShortcut(idx, "link", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppDialog>
  );
}

function EditMemberModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.userId as string;
  const u = useStore((s) => s.users.find((u) => u.id === id));
  const update = useStore((s) => s.updateTeamMember);
  const remove = useStore((s) => s.removeTeamMember);
  const resendInvite = useStore((s) => s.resendTeamInvite);
  const { busy, run } = useAsyncAction();
  const { busy: resendBusy, run: runResend } = useAsyncAction();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState(() => ({
    name: u?.name ?? "",
    title: u?.title ?? "",
    email: u?.email ?? "",
    role: u?.role ?? "team",
    city: u?.city ?? "",
    state: u?.state ?? "",
    zipCode: u?.zipCode ?? "",
    address: u?.address ?? "",
    financialType: u?.financialType ?? "hourly",
    financialAmount: u?.financialAmount ?? u?.hourlyRate ?? 0,
    internalNotes: u?.internalNotes ?? u?.bio ?? "",
    phone: u?.phone ?? "",
    timezone: u?.timezone ?? "America/Los_Angeles",
  }));

  const [shortcuts, setShortcuts] = useState<Array<{ name: string; link: string }>>(() => u?.shortcuts || []);

  if (!u) return null;

  const addShortcut = () => {
    setShortcuts([...shortcuts, { name: "", link: "" }]);
  };

  const updateShortcut = (index: number, key: string, val: string) => {
    const next = [...shortcuts];
    next[index] = { ...next[index], [key]: val };
    setShortcuts(next);
  };

  const removeShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await run(() => update(id, {
      ...form,
      shortcuts,
    }), "Member updated");
    close();
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title={
        <div>
          <div className="text-lg font-semibold tracking-tight">Edit team member</div>
          <div className="text-sm text-muted-foreground font-normal">View and manage member workspace profile attributes.</div>
        </div>
      }
      icon={<UserCog className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-between items-center">
          <div>
            <button
              type="button"
              onClick={async () => {
                if (confirmDelete) {
                  await run(() => remove(id), `${u.name} deleted`);
                  close();
                } else {
                  setConfirmDelete(true);
                }
              }}
              className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              {confirmDelete ? "Confirm Delete" : "Delete Member"}
            </button>
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={() => { setConfirmDelete(false); close(); }}>Cancel</GhostButton>
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
      <div className="space-y-6">
        {/* Portal access section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portal Access</h4>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <button
              type="button"
              disabled={resendBusy}
              onClick={() => runResend(() => resendInvite(u.id), `Invite email resent to ${u.email}`)}
              className="shrink-0 h-9 px-3.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer disabled:opacity-60"
            >
              Resend invite email
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Sends a fresh one-time sign-in link to this member's email — useful if their first invite expired or got lost.
          </p>
        </div>

        {/* Profile Info Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Info</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
              <option value="team">Team</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</h4>
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <TextField label="Zip Code" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
          </div>
        </div>

        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financials</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Type" value={form.financialType} onChange={(e) => setForm({ ...form, financialType: e.target.value })}>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
              <option value="contract">Contract</option>
              <option value="retainer">Retainer</option>
            </SelectField>
            <TextField label="Amount ($)" type="number" value={form.financialAmount.toString()} onChange={(e) => setForm({ ...form, financialAmount: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</h4>
          <div>
            <RichEditor value={form.internalNotes} onChange={(v) => setForm({ ...form, internalNotes: v })} minHeight={120} />
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="space-y-4 border-t border-border/40 pt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shortcuts</h4>
            <button
              type="button"
              onClick={addShortcut}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              + Add Shortcut
            </button>
          </div>
          {shortcuts.map((sh, idx) => (
            <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-border/50 bg-muted/10 relative">
              <button
                type="button"
                onClick={() => removeShortcut(idx)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 text-xs font-medium cursor-pointer"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <TextField
                  label="Shortcut Name"
                  placeholder="e.g. Wiki"
                  value={sh.name}
                  onChange={(e) => updateShortcut(idx, "name", e.target.value)}
                />
                <TextField
                  label="Shortcut Link"
                  placeholder="https://..."
                  value={sh.link}
                  onChange={(e) => updateShortcut(idx, "link", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
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
      title={`Delete ${u.name}?`}
      description="They'll lose access to all internal projects immediately. Their past work and time entries are retained."
      icon={<Trash2 className="h-5 w-5" />}
      destructive
      confirmLabel="Delete member"
      busy={busy}
      onCancel={close}
      onConfirm={async () => { await run(() => remove(id), `${u.name} deleted`); close(); }}
    />
  );
}

/* ─────────────────────────── Modals: Time ─────────────────────────── */

function LogTimeModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const allTasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.users).filter((u) => u.role !== "client");
  const log = useStore((s) => s.logTime);
  const { busy, run } = useAsyncAction();
  const lockedUserId = payload?.userId as string | undefined;
  const availableProjects = lockedUserId ? projects.filter((p) => isProjectMember(p, allTasks, lockedUserId)) : projects;
  const [form, setForm] = useState({
    userId: lockedUserId ?? team[0]?.id ?? "",
    projectId: (payload?.projectId as string) ?? availableProjects[0]?.id ?? "",
    taskId: (payload?.taskId as string) ?? "",
    date: new Date().toISOString().slice(0, 10),
    hours: 1,
    note: "",
    billable: true,
  });
  const projectTasks = allTasks.filter((t) => t.projectId === form.projectId);
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
            onClick={async () => { await run(() => log({ ...form, taskId: form.taskId || undefined }), `Logged ${form.hours}h`); close(); }}
          >
            Log time
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <SelectField
          label="Project"
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value, taskId: "" })}
        >
          {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <SelectField label="Task (optional)" value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })}>
          <option value="">No specific task</option>
          {projectTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </SelectField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          {lockedUserId ? (
            <div>
              <FieldLabel>Team</FieldLabel>
              <div className="mt-1 flex items-center rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {team.find((u) => u.id === lockedUserId)?.name ?? "You"}
              </div>
            </div>
          ) : (
            <SelectField label="Team" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  const allTasks = useStore((s) => s.tasks);
  const update = useStore((s) => s.updateTimeEntry);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    projectId: entry?.projectId ?? "",
    taskId: entry?.taskId ?? "",
    date: entry?.date ?? today2(),
    hours: entry?.hours ?? 0,
    note: entry?.note ?? "",
    billable: entry?.billable ?? true,
  }));
  const projectTasks = allTasks.filter((t) => t.projectId === form.projectId);
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
          <PrimaryButton
            loading={busy}
            onClick={async () => { await run(() => update(id, { ...form, taskId: form.taskId || undefined }), "Entry updated"); close(); }}
          >
            Save
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <SelectField
          label="Project"
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value, taskId: "" })}
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <SelectField label="Task (optional)" value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })}>
          <option value="">No specific task</option>
          {projectTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </SelectField>
        <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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


/* ─────────────────────────── Registry ─────────────────────────── */

const REGISTRY: Record<ModalKey, React.FC<{ close: () => void; payload?: ModalPayload }>> = {
  "project.new": NewProjectModal,
  "project.edit": EditProjectModal,
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
  "request.close": CloseRequestModal,
  "request.convert": ConvertRequestChoiceModal,
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
