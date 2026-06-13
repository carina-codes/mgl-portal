/**
 * Modals — central modal system for the MGL Client Platform.
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AppDialog,
  FieldGroup,
  FieldLabel,
  TextField,
  SelectField,
} from "@/components/ui/app-dialog";
import { RichEditor } from "@/components/rich-editor";
import { useStore } from "@/lib/store";
import {
  PROJECT_STATUS_META,
  STAGE_META,
  PRIORITY_META,
  REQUEST_STATUS_META,
  REQUEST_TYPE_META,
  DELIVERABLE_STATUS_META,
  type ProjectStatus,
  type TaskStage,
  type Priority,
  type RequestType,
  type RequestStatus,
  type DeliverableStatus,
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
} from "lucide-react";

/* ─────────────────────────── Registry types ─────────────────────────── */

export type ModalKey =
  // Projects
  | "project.new"
  | "project.edit"
  | "project.archive"
  | "project.status"
  // Clients
  | "client.new"
  | "client.edit"
  | "client.archive"
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
  // Deliverables
  | "deliverable.upload"
  | "deliverable.edit"
  | "deliverable.revision"
  | "deliverable.approve"
  | "deliverable.reject"
  // Documents
  | "doc.upload"
  | "doc.folder.new"
  | "doc.folder.rename"
  | "doc.move"
  | "doc.delete"
  // Team
  | "team.add"
  | "team.edit"
  | "team.remove"
  // Time
  | "time.log"
  | "time.edit"
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
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
      className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-60"
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
  const allUsers = useStore((s) => s.users);
  const team = allUsers.filter((u) => u.role !== "client");
  const createProject = useStore((s) => s.createProject);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    name: "",
    clientId: (payload?.clientId as string) ?? clients[0]?.id ?? "",
    description: "",
    type: "fixed" as "fixed" | "hourly",
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
      <FieldGroup>
        <TextField
          label="Project name"
          placeholder="e.g. NovaBoard Mobile App"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
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
            onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "hourly" })}
          >
            <option value="fixed">Fixed bid</option>
            <option value="hourly">Hourly / retainer</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="Budget (USD)"
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
          />
          <TextField
            label="Hours estimate"
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
        <div className="grid grid-cols-2 gap-3">
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
        <div>
          <FieldLabel hint="Pick the people staffed to this project">Team</FieldLabel>
          <MultiUserPicker
            users={team}
            selected={form.team}
            onChange={(team) => setForm({ ...form, team })}
          />
        </div>
        <div>
          <FieldLabel>Brief</FieldLabel>
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
  const updateProject = useStore((s) => s.updateProject);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    name: project?.name ?? "",
    clientId: project?.clientId ?? "",
    description: project?.description ?? "",
    budget: project?.budget ?? 0,
    hoursEstimate: project?.hoursEstimate ?? 0,
    endDate: project?.endDate ?? "",
  }));
  if (!project) return null;

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
      <FieldGroup>
        <TextField label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <SelectField label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Budget (USD)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
          <TextField label="Hours estimate" type="number" value={form.hoursEstimate} onChange={(e) => setForm({ ...form, hoursEstimate: Number(e.target.value) })} />
          <TextField label="Target launch" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Brief</FieldLabel>
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
              className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${m.cls}`}>{m.label}</span>
              </div>
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
  const [form, setForm] = useState({
    name: "",
    industry: "",
    contact: "",
    contactEmail: "",
    retainer: "Project",
    logoColor: "#0049FE",
  });
  const valid = form.name && form.industry && form.contactEmail.includes("@");

  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="New client"
      description="Add a client and primary contact to start collaborating."
      icon={<UserPlus className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => {
              await run(() => create(form), "Client added");
              close();
            }}
          >
            Add client
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <TextField label="Industry" placeholder="SaaS · DTC · Brand" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primary contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <TextField label="Contact email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Engagement" value={form.retainer} onChange={(e) => setForm({ ...form, retainer: e.target.value })}>
            <option>Project</option>
            <option>Fixed bid</option>
            <option>$8k / mo</option>
            <option>$12k / mo</option>
            <option>$18k / mo</option>
          </SelectField>
          <div>
            <FieldLabel>Brand color</FieldLabel>
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
        </div>
        {!valid && (form.name || form.contactEmail) && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Make sure name, industry and a valid email are filled in.
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
  const [form, setForm] = useState(() => ({
    name: client?.name ?? "",
    industry: client?.industry ?? "",
    contact: client?.contact ?? "",
    contactEmail: client?.contactEmail ?? "",
    retainer: client?.retainer ?? "Project",
    logoColor: client?.logoColor ?? "#0049FE",
    status: client?.status ?? "active",
    health: client?.health ?? "healthy",
  }));
  if (!client) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit client"
      description="Update company, contact and account health."
      icon={<UserCog className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              await run(() => update(id, form), "Client updated");
              close();
            }}
          >
            Save changes
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Company" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <TextField label="Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </SelectField>
          <SelectField label="Health" value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value as typeof form.health })}>
            <option value="healthy">Healthy</option>
            <option value="watch">Watch</option>
            <option value="at-risk">At risk</option>
          </SelectField>
          <TextField label="Retainer" value={form.retainer} onChange={(e) => setForm({ ...form, retainer: e.target.value })} />
        </div>
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
    assignees: [] as string[],
  });
  const valid = form.title.trim().length > 1 && !!form.projectId;

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
          <PrimaryButton
            disabled={!valid}
            loading={busy}
            onClick={async () => {
              await run(() => create(form), "Task created");
              close();
            }}
          >
            Create task
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Title" placeholder="e.g. Polish hero animation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor
            value={form.note}
            onChange={(v) => setForm({ ...form, note: v })}
            placeholder="Context, links, @mentions…"
            minHeight={120}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <TextField label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
        <div>
          <FieldLabel>Assignees</FieldLabel>
          <MultiUserPicker users={team} selected={form.assignees} onChange={(assignees) => setForm({ ...form, assignees })} />
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

/* ─────────────────────────── Modals: Deliverables ─────────────────────────── */

function UploadDeliverableModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const projects = useStore((s) => s.projects);
  const create = useStore((s) => s.createDeliverable);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState({
    projectId: (payload?.projectId as string) ?? projects[0]?.id ?? "",
    title: "",
    description: "",
    version: "v1",
    status: "internal_review" as DeliverableStatus,
    fileCount: 1,
  });
  const valid = form.title.trim() && form.projectId;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Upload deliverable"
      description="Package files into a versioned deliverable for review."
      icon={<PackageCheck className="h-5 w-5" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            disabled={!valid}
            onClick={async () => {
              await run(() => create(form), "Deliverable uploaded");
              close();
            }}
          >
            Upload deliverable
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Title" placeholder="e.g. Pricing page — final" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} minHeight={100} placeholder="What's included, what changed since last version…" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <TextField label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DeliverableStatus })}>
            {(Object.keys(DELIVERABLE_STATUS_META) as DeliverableStatus[]).map((s) => (
              <option key={s} value={s}>{DELIVERABLE_STATUS_META[s].label}</option>
            ))}
          </SelectField>
        </div>
        <Dropzone />
      </FieldGroup>
    </AppDialog>
  );
}

function EditDeliverableModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.deliverableId as string;
  const d = useStore((s) => s.deliverables.find((d) => d.id === id));
  const update = useStore((s) => s.updateDeliverable);
  const { busy, run } = useAsyncAction();
  const [form, setForm] = useState(() => ({
    title: d?.title ?? "",
    description: d?.description ?? "",
    version: d?.version ?? "v1",
    status: d?.status ?? ("internal_review" as DeliverableStatus),
  }));
  if (!d) return null;
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Edit deliverable"
      icon={<PackageCheck className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton loading={busy} onClick={async () => { await run(() => update(id, form), "Deliverable updated"); close(); }}>
            Save changes
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div>
          <FieldLabel>Description</FieldLabel>
          <RichEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} minHeight={120} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DeliverableStatus })}>
            {(Object.keys(DELIVERABLE_STATUS_META) as DeliverableStatus[]).map((s) => (
              <option key={s} value={s}>{DELIVERABLE_STATUS_META[s].label}</option>
            ))}
          </SelectField>
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function RevisionDeliverableModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.deliverableId as string;
  const set = useStore((s) => s.setDeliverableStatus);
  const [note, setNote] = useState("");
  const { busy, run } = useAsyncAction();
  return (
    <AppDialog
      open
      onOpenChange={(v) => !v && close()}
      title="Request revision"
      description="Send the deliverable back with specific feedback."
      icon={<RefreshCw className="h-5 w-5" />}
      footer={
        <div className="flex w-full justify-end gap-2">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={async () => {
              if (!note.trim()) return toast.error("Add at least one note for the revision.");
              await run(() => set(id, "revision_requested"), "Revision requested");
              close();
            }}
          >
            Send revision request
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <div>
          <FieldLabel>Revision notes</FieldLabel>
          <RichEditor value={note} onChange={setNote} placeholder="Be specific — what needs to change?" minHeight={140} />
        </div>
      </FieldGroup>
    </AppDialog>
  );
}

function ApproveDeliverableModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.deliverableId as string;
  const set = useStore((s) => s.setDeliverableStatus);
  const { busy, run } = useAsyncAction();
  return (
    <ConfirmDialog
      title="Approve this deliverable?"
      description="Approval will notify the team and mark it ready for handoff."
      icon={<CheckCircle2 className="h-5 w-5" />}
      confirmLabel="Approve"
      busy={busy}
      onCancel={close}
      onConfirm={async () => { await run(() => set(id, "approved"), "Deliverable approved"); close(); }}
    />
  );
}

function RejectDeliverableModal({ close, payload }: { close: () => void; payload?: ModalPayload }) {
  const id = payload?.deliverableId as string;
  const set = useStore((s) => s.setDeliverableStatus);
  const { busy, run } = useAsyncAction();
  return (
    <ConfirmDialog
      title="Reject this deliverable?"
      description="Rejection sends it back to the team as not approved."
      icon={<XCircle className="h-5 w-5" />}
      confirmLabel="Reject deliverable"
      destructive
      busy={busy}
      onCancel={close}
      onConfirm={async () => { await run(() => set(id, "rejected"), "Deliverable rejected"); close(); }}
    />
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
        <Dropzone onFileName={(n) => setForm((f) => ({ ...f, name: n }))} />
        <TextField label="File name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. brief-v2.pdf" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <SelectField label="Folder" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}>
            {folders.map((f) => <option key={f} value={f}>{f}</option>)}
          </SelectField>
        </div>
        <label className="flex items-center gap-2 text-sm">
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
            onClick={async () => { await run(() => create(projectId, name.trim()), "Folder created"); close(); }}
          >
            Create folder
          </PrimaryButton>
        </div>
      }
    >
      <FieldGroup>
        <SelectField label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
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
  const team = useStore((s) => s.users.filter((u) => u.role !== "client"));
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

function Dropzone({ onFileName }: { onFileName?: (n: string) => void }) {
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
        if (f) { setName(f.name); onFileName?.(f.name); }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${hover ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted"}`}
    >
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { setName(f.name); onFileName?.(f.name); }
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

  "client.new": NewClientModal,
  "client.edit": EditClientModal,
  "client.archive": ArchiveClientModal,

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

  "deliverable.upload": UploadDeliverableModal,
  "deliverable.edit": EditDeliverableModal,
  "deliverable.revision": RevisionDeliverableModal,
  "deliverable.approve": ApproveDeliverableModal,
  "deliverable.reject": RejectDeliverableModal,

  "doc.upload": UploadDocumentModal,
  "doc.folder.new": NewFolderModal,
  "doc.folder.rename": RenameFolderModal,
  "doc.move": MoveFileModal,
  "doc.delete": DeleteFileModal,

  "team.add": AddMemberModal,
  "team.edit": EditMemberModal,
  "team.remove": RemoveMemberModal,

  "time.log": LogTimeModal,
  "time.edit": EditTimeModal,

  "ai.review": AIReviewModal,
  "ai.confirm": AIConfirmModal,
};

/* keep unused imports referenced to satisfy bundler tree-shake quiet */
void useEffect;
