"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack } from "@/components/user-avatar";
import { useStore } from "@/lib/store";
import { useModals } from "@/components/modals";
import {
  PROJECT_STATUS_META,
  REQUEST_STATUS_META,
  PRIORITY_META,
  type Client,
  type ProjectStatus,
  type RequestStatus,
  type Priority,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  Mail,
  Plus,
  Share2,
  Settings as SettingsIcon,
  UserPlus,
  Search,
  MoreHorizontal,
  Phone,
  Globe,
  Clock,
  ExternalLink,
  Trash2,
  Edit2,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  Link2,
  Copy,
  Check,
  FolderOpen,
  FileText,
  File,
  Download,
  Info,
  Users,
  Compass,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const TABS = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "requests", label: "Requests", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ClientDetail() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const { open } = useModals();

  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const requests = useStore((s) => s.requests);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const clientProjects = useMemo(() => projects.filter((p) => p.clientId === clientId), [projects, clientId]);
  const clientRequests = useMemo(() => requests.filter((r) => r.clientId === clientId), [requests, clientId]);

  const [tab, setTab] = useState<TabId>("overview");

  if (!client) throw notFound();

  const submittedRequestsCount = useMemo(() => {
    return clientRequests.filter((r) => r.status === "submitted" || r.status === "under_review").length;
  }, [clientRequests]);

  return (
    <AppShell>
      <Link
        href="/owner/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All clients
      </Link>

      {/* Main Header Card */}
      <div className="panel p-6 bg-card/50 backdrop-blur-sm border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-2xl font-bold text-white shadow-sm border border-white/10"
              style={{ backgroundColor: client.logoColor }}
            >
              {client.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>{client.industry}</span>
                <span className="text-muted-foreground/45">•</span>
                <span>Since {client.since}</span>
                <span className="text-muted-foreground/45">•</span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_TONE(client.status))}>
                  {client.status}
                </span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", HEALTH_TONE(client.health))}>
                  {client.health}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => open("client.edit", { clientId: client.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => open("client.share", { clientId: client.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button
              onClick={() => open("client.invite", { clientId: client.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </button>
            <button
              onClick={() => open("client.settings", { clientId: client.id })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <SettingsIcon className="h-3.5 w-3.5" /> Settings
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="panel p-5 bg-card/50 backdrop-blur-sm border-border/60 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Contact</div>
            <div className="mt-2 text-lg font-bold text-foreground">{client.contact}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{client.contactRole || "Lead Representative"}</div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span className="truncate max-w-[170px]">{client.contactEmail}</span>
            {client.preferredContactMethod && (
              <span className="capitalize text-[10px] bg-muted px-2 py-0.5 rounded border border-border/40">
                Via {client.preferredContactMethod}
              </span>
            )}
          </div>
        </div>

        <div className="panel p-5 bg-card/50 backdrop-blur-sm border-border/60 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hours this month</div>
            <div className="mt-2 text-3xl font-extrabold text-foreground">{client.hoursMonth} hrs</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">Across {clientProjects.length} active projects</div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <span>Retainer model:</span>
            <span className="text-foreground font-bold">{client.retainer}</span>
          </div>
        </div>

        <div className="panel p-5 bg-card/50 backdrop-blur-sm border-border/60 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Open Requests</div>
            <div className="mt-2 text-3xl font-extrabold text-foreground">{clientRequests.length}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{submittedRequestsCount} require active review</div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground font-semibold">
            Total historical requests: <span className="text-foreground font-bold">{clientRequests.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6 mb-6 flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {t.id === "requests" && submittedRequestsCount > 0 && (
                  <span
                    className={cn(
                      "absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-[1px]",
                      active ? "bg-white ring-primary" : "bg-primary ring-card"
                    )}
                  />
                )}
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {tab === "overview" && <OverviewTab client={client} />}
        {tab === "projects" && <ProjectsTab client={client} projects={clientProjects} users={users} />}
        {tab === "requests" && <RequestsTab client={client} requests={clientRequests} projects={projects} />}
        {tab === "documents" && <DocumentsTab client={client} clientProjects={clientProjects} />}
      </div>
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── HELPERS ─────────────────────────────────────────────────────────── */

function STATUS_TONE(status: string) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  if (status === "paused") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  return "bg-muted text-muted-foreground border border-border/60";
}

function HEALTH_TONE(health: string) {
  if (health === "healthy") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  if (health === "watch") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
}

/* ─────────────────────────────────────────────────────────── OVERVIEW TAB ─────────────────────────────────────────────────────────── */

function OverviewTab({ client }: { client: Client }) {
  const updateClient = useStore((s) => s.updateClient);
  const { open } = useModals();

  const handleRemoveContact = (email: string) => {
    const contacts = client.additionalContacts || [];
    const updated = contacts.filter((c) => c.email !== email);
    updateClient(client.id, { additionalContacts: updated });
    toast.success("Additional contact removed");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left 2 Columns: Profiles & Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Company profile details */}
        <div className="panel p-6 bg-card border-border/60 space-y-5">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Company Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Website</span>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold mt-1"
                >
                  {client.website.replace("https://", "")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-muted-foreground mt-1 block">Not set</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Industry</span>
              <span className="text-foreground font-semibold mt-1 block">{client.industry}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Billing Structure</span>
              <span className="text-foreground font-semibold mt-1 block">{client.retainer}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Brand Accent Color</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="h-4 w-4 rounded-full border border-black/10 inline-block"
                  style={{ backgroundColor: client.logoColor }}
                />
                <span className="font-mono text-xs uppercase text-muted-foreground font-semibold">{client.logoColor}</span>
              </div>
            </div>
          </div>

          {client.description && (
            <div className="pt-3 border-t border-border/40 text-sm">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">About Company</span>
              <p className="text-muted-foreground font-medium leading-relaxed">{client.description}</p>
            </div>
          )}

          {client.tags && client.tags.length > 0 && (
            <div className="pt-3 border-t border-border/40">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">Workspace Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {client.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-primary/5 text-primary border border-primary/10 px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Contact Details */}
        <div className="panel p-6 bg-card border-border/60 space-y-5">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Primary Contact Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Name</span>
              <span className="text-foreground font-semibold mt-1 block">{client.contact}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Role / Title</span>
              <span className="text-foreground font-semibold mt-1 block">{client.contactRole || "Account Contact"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Email Address</span>
              <a href={`mailto:${client.contactEmail}`} className="text-primary hover:underline font-semibold mt-1 block truncate">
                {client.contactEmail}
              </a>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Direct Phone</span>
              {client.contactPhone ? (
                <span className="text-foreground font-semibold mt-1 block">{client.contactPhone}</span>
              ) : (
                <span className="text-muted-foreground mt-1 block">Not set</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Preferred Contact Method</span>
              <span className="capitalize text-foreground font-semibold mt-1 block">{client.preferredContactMethod || "Email"}</span>
            </div>
          </div>
        </div>

        {/* Additional Contacts Table */}
        <div className="panel p-6 bg-card border-border/60 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Additional Authorized Contacts</h3>
            </div>
            <button
              onClick={() => open("client.invite", { clientId: client.id })}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              <Plus className="h-3 w-3" /> Add Contact
            </button>
          </div>

          <div className="overflow-x-auto">
            {client.additionalContacts && client.additionalContacts.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/60">
                    <th className="py-2 font-bold uppercase">Name</th>
                    <th className="py-2 font-bold uppercase">Title / Dept</th>
                    <th className="py-2 font-bold uppercase">Email</th>
                    <th className="py-2 font-bold uppercase">Phone</th>
                    <th className="py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-medium">
                  {client.additionalContacts.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-muted/5 group">
                      <td className="py-2.5 font-bold text-foreground">{contact.name}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {contact.title} {contact.department && <span className="text-[10px] text-muted-foreground/60">({contact.department})</span>}
                      </td>
                      <td className="py-2.5 text-primary truncate max-w-[140px]">{contact.email}</td>
                      <td className="py-2.5 text-muted-foreground">{contact.phone || "—"}</td>
                      <td className="py-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRemoveContact(contact.email)}
                          className="text-rose-500 hover:text-rose-600 p-1 hover:bg-rose-500/5 rounded transition-all cursor-pointer"
                          title="Remove contact"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No additional contacts configured. Click "Add Contact" above to invite.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Address, Map, Working Hours, availability & Socials */}
      <div className="space-y-6">
        {/* Location & Timezone card */}
        <div className="panel p-6 bg-card border-border/60 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Location & Availability</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Time Zone</span>
                <span className="font-semibold text-foreground mt-0.5 block">{client.timezone || "America/New_York"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Working Hours</span>
                <span className="font-semibold text-foreground mt-0.5 block">{client.workingHours || "9:00 AM - 5:00 PM"}</span>
              </div>
            </div>

            {client.address && (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Business Address</span>
                <span className="font-semibold text-foreground mt-0.5 block leading-relaxed">
                  {client.address}
                  {(client.city || client.state) && (
                    <span className="block text-muted-foreground text-[11px] font-medium">
                      {[client.city, client.state, client.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Simple Map Overlay Mock */}
            <div className="relative h-28 w-full rounded-xl overflow-hidden border border-border bg-muted/40 grid place-items-center group">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative text-center p-4">
                <Compass className="h-6 w-6 text-primary/70 mx-auto animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-2 block tracking-wider">Map directions</span>
              </div>
              {client.mapDirectionsLink && (
                <a
                  href={client.mapDirectionsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <span className="bg-background text-foreground text-[10px] font-bold border px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    Open in Maps <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Availability & Account notes */}
        <div className="panel p-6 bg-card border-border/60 space-y-4 text-xs font-semibold">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Availability & Notes</h3>
          </div>

          {client.availabilityNotes && (
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Availability Notes</span>
              <p className="text-muted-foreground font-medium leading-relaxed bg-muted/20 p-2.5 border border-border/40 rounded-xl">
                {client.availabilityNotes}
              </p>
            </div>
          )}

          {client.notes && (
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Client Notes</span>
              <div
                className="prose prose-sm dark:prose-invert font-medium text-muted-foreground leading-relaxed max-h-48 overflow-y-auto pr-1"
                dangerouslySetInnerHTML={{ __html: client.notes }}
              />
            </div>
          )}

          {client.internalNotes && (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Internal Team Notes</span>
              <p className="text-rose-700/80 dark:text-rose-300/80 font-medium leading-relaxed">{client.internalNotes}</p>
            </div>
          )}
        </div>

        {/* Social Presence Grid */}
        {client.socialLinks && Object.values(client.socialLinks).some(Boolean) && (
          <div className="panel p-6 bg-card border-border/60 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Link2 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Social Profiles</h3>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs font-bold font-mono">
              {client.socialLinks.linkedin && (
                <a
                  href={client.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {client.socialLinks.twitter && (
                <a
                  href={client.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <span>Twitter / X</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {client.socialLinks.facebook && (
                <a
                  href={client.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <span>Facebook</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── PROJECTS TAB ─────────────────────────────────────────────────────────── */

function ProjectsTab({
  client,
  projects,
  users,
}: {
  client: Client;
  projects: any[];
  users: any[];
}) {
  const { open } = useModals();

  if (projects.length === 0) {
    return (
      <div className="panel grid place-items-center gap-3 p-12 text-center border-border/60 bg-card/50">
        <Building2 className="h-10 w-10 text-muted-foreground/60" />
        <div className="space-y-1">
          <h4 className="font-bold text-foreground">No Projects Yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            There are no projects assigned to {client.name} in this workspace.
          </p>
        </div>
        <button
          onClick={() => open("project.new", { clientId: client.id })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Start Project
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => {
        const accent = (p.accent || "progress") as "todo" | "progress" | "review" | "done";
        const accentCls = {
          todo: {
            cardHover: "hover:border-rose-500/25",
            glow: "bg-rose-500/5 group-hover:bg-rose-500/10",
            badge: "bg-todo text-todo-foreground border-todo-foreground/20",
            bar: "bg-rose-500",
            textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
          },
          progress: {
            cardHover: "hover:border-amber-500/25",
            glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
            badge: "bg-progress text-progress-foreground border-progress-foreground/20",
            bar: "bg-amber-500",
            textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
          },
          review: {
            cardHover: "hover:border-sky-500/25",
            glow: "bg-sky-500/5 group-hover:bg-sky-500/10",
            badge: "bg-review text-review-foreground border-review-foreground/20",
            bar: "bg-sky-500",
            textHover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
          },
          done: {
            cardHover: "hover:border-emerald-500/25",
            glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
            badge: "bg-done text-done-foreground border-done-foreground/20",
            bar: "bg-emerald-500",
            textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
          },
        }[accent] || {
          cardHover: "hover:border-primary/25",
          glow: "bg-primary/5 group-hover:bg-primary/10",
          badge: "bg-muted text-muted-foreground border-muted-foreground/20",
          bar: "bg-primary",
          textHover: "group-hover:text-primary",
        };

        return (
          <div
            key={p.id}
            className={cn(
              "group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-card/85",
              accentCls.cardHover
            )}
          >
            <div className={cn("absolute right-0 top-0 -mt-8 -mr-8 h-24 w-24 rounded-full blur-xl transition-all duration-500 pointer-events-none", accentCls.glow)} />

            <Link href={`/owner/projects/${p.id}`} className="block space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold border transition-all duration-300",
                  accentCls.badge
                )}>
                  {p.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={cn("text-base font-bold tracking-tight text-foreground transition-colors leading-tight truncate", accentCls.textHover)}>
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">{client.name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${PROJECT_STATUS_META[p.status as ProjectStatus].cls}`}>
                  {PROJECT_STATUS_META[p.status as ProjectStatus].label}
                </span>
                <span className="font-semibold text-muted-foreground capitalize bg-muted/45 px-2 py-0.5 rounded text-[10px]">
                  {p.type === "fixed" ? "Fixed Bid" : p.type}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">{p.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", accentCls.bar)}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Target launch: <span className="text-foreground font-semibold">{p.endDate}</span>
                </p>
              </div>
            </Link>

            <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
              <AvatarStack userIds={p.team} users={users} max={4} size={26} />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => open("project.edit", { projectId: p.id })}
                  className="rounded-full border border-border/50 bg-background/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer text-foreground"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── REQUESTS TAB ─────────────────────────────────────────────────────────── */

function RequestsTab({
  client,
  requests,
  projects,
}: {
  client: Client;
  requests: any[];
  projects: any[];
}) {
  const { open } = useModals();

  if (requests.length === 0) {
    return (
      <div className="panel grid place-items-center gap-3 p-12 text-center border-border/60 bg-card/50">
        <FileText className="h-10 w-10 text-muted-foreground/60" />
        <div className="space-y-1">
          <h4 className="font-bold text-foreground">No Requests Submitted</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            {client.name} has not submitted any service or feature requests.
          </p>
        </div>
        <button
          onClick={() => open("request.new", { clientId: client.id })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Submit Request
        </button>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/60">
            <tr>
              <th className="px-5 py-3.5 font-bold">Request Title</th>
              <th className="px-5 py-3.5 font-bold">Project Name</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 font-bold">Priority</th>
              <th className="px-5 py-3.5 font-bold">Submitted Date</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-medium">
            {requests.map((r) => {
              const project = projects.find((p) => p.id === r.projectId);
              return (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-foreground font-semibold">
                    <button
                      onClick={() => open("request.review", { requestId: r.id })}
                      className="hover:text-primary transition-colors text-left font-bold"
                    >
                      {r.title}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {project ? project.name : "General Retainer"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", REQUEST_STATUS_META[r.status as RequestStatus]?.cls)}>
                      {REQUEST_STATUS_META[r.status as RequestStatus]?.label || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", PRIORITY_META[r.priority as Priority]?.cls)}>
                      {PRIORITY_META[r.priority as Priority]?.label || r.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {r.submittedAt}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => open("request.review", { requestId: r.id })}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold border hover:bg-muted hover:text-foreground transition-all cursor-pointer text-foreground bg-background"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── DOCUMENTS TAB ─────────────────────────────────────────────────────────── */

function DocumentsTab({
  client,
  clientProjects,
}: {
  client: Client;
  clientProjects: any[];
}) {
  const { open } = useModals();
  const allDocuments = useStore((s) => s.documents);
  const renameDocument = useStore((s) => s.renameDocument);

  const projectIds = useMemo(() => clientProjects.map((p) => p.id), [clientProjects]);

  const documents = useMemo(() => {
    return allDocuments.filter(
      (d) => projectIds.includes(d.projectId) && d.name !== ".keep"
    );
  }, [allDocuments, projectIds]);

  const [fileQuery, setFileQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Inline editing state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");

  const folders = useMemo(() => {
    return Array.from(new Set(documents.map((d) => d.folder)));
  }, [documents]);

  const filteredFiles = useMemo(() => {
    return documents.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(fileQuery.toLowerCase());
      const matchFolder = selectedFolder ? f.folder === selectedFolder : true;
      return matchSearch && matchFolder;
    });
  }, [documents, fileQuery, selectedFolder]);

  const handleSaveRename = (id: string) => {
    if (!editingDocName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }
    renameDocument(id, editingDocName.trim());
    setEditingDocId(null);
    toast.success("File renamed successfully");
  };

  const getFileIconComponent = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return FileText; // or FileImage if imported
    return FileText;
  };

  if (clientProjects.length === 0) {
    return (
      <div className="panel grid place-items-center gap-3 p-12 text-center border-border/60 bg-card/50">
        <FolderOpen className="h-10 w-10 text-muted-foreground/60" />
        <div className="space-y-1">
          <h4 className="font-bold text-foreground">No Documents Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Documents are managed within projects. Start a project for {client.name} to upload documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Folder Sidebar */}
      <div className="panel p-4 lg:col-span-1 bg-card border-border/60 h-fit space-y-4">
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Directories</div>
          <div className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition-colors cursor-pointer",
                selectedFolder === null
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> All Client Files
              </span>
              <span className="bg-muted px-2 py-0.5 rounded text-[10px]">{documents.length}</span>
            </button>

            {folders.map((f) => {
              const isSelected = selectedFolder === f;
              const count = documents.filter((x) => x.folder === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="inline-flex items-center gap-2 truncate pr-2">
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                    <span className="truncate">{f}</span>
                  </span>
                  <span className="bg-muted px-1.5 py-0.5 rounded text-[9px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Files List / Grid area */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search / Upload Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border/60 rounded-3xl p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              className="w-full h-9 rounded-xl border border-border bg-background pl-9 pr-4 text-xs focus:border-primary focus:outline-none text-foreground font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => open("doc.upload", { projectId: projectIds[0] })}
              className="h-9 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Upload File
            </button>
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const IconComp = getFileIconComponent(file.name);
              const isEditing = editingDocId === file.id;

              return (
                <div
                  key={file.id}
                  className="panel p-4 bg-card border-border/50 hover:border-primary/25 transition-all flex flex-col justify-between h-36 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/5 border border-primary/10 shrink-0">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingDocName}
                            onChange={(e) => setEditingDocName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(file.id)}
                            className="w-full border border-border bg-background px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(file.id)}
                            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-xs font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors cursor-pointer" title={file.name}>
                          {file.name}
                        </h4>
                      )}
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{file.size} · {file.folder}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-2.5 mt-2 text-[10px] text-muted-foreground font-semibold">
                    <span className="truncate max-w-[100px]" title={`Uploaded by ${file.uploadedBy}`}>
                      By {file.uploadedBy}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingDocId(file.id);
                          setEditingDocName(file.name);
                        }}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                        title="Rename file"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <a
                        href={file.previewUrl || "#"}
                        download
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Download file"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="panel grid place-items-center gap-2 p-12 text-center border-border/60 bg-card/50 text-xs text-muted-foreground">
            No documents matched your search filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDetail;
