"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvatarStack, UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/lib/store";
import { useModals } from "@/components/modals";
import {
  STAGE_META,
  PRIORITY_META,
  type TaskStage,
  type Task,
  type User,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  Mail,
  Plus,
  UserCog,
  Phone,
  Globe,
  Clock,
  ExternalLink,
  Trash2,
  Edit2,
  Building2,
  MapPin,
  Calendar,
  Link2,
  Check,
  Folder,
  FileText,
  Info,
  Users,
  Briefcase,
  Github,
  Twitter,
  Linkedin,
  AlertCircle,
  ListTodo,
  Lock,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AppDialog, TextField, FieldGroup } from "@/components/ui/app-dialog";

const TABS = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "time", label: "Time Logged", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MemberDetail() {
  const params = useParams();
  const memberId = params?.memberId as string;
  const router = useRouter();
  const { open } = useModals();

  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const timeEntries = useStore((s) => s.timeEntries);
  const updateTeamMember = useStore((s) => s.updateTeamMember);

  const member = useMemo(() => users.find((u) => u.id === memberId), [users, memberId]);

  const [tab, setTab] = useState<TabId>("overview");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Editable local fields synchronized to the store/state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "", relationship: "" });
  
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [address, setAddress] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (member) {
      setBio(member.bio || "");
      setPhone(member.phone || "");
      setTimezone(member.timezone || "EST (UTC-5)");
      setWorkingHours(member.workingHours || "9:00 AM - 5:00 PM");
      setAddress(member.address || "Brooklyn, NY");
      setLinkedinUrl(member.linkedin || "");
      setGithubUrl(member.github || "");
      setNotes(member.notes || "");
      setEmergencyContact(member.emergencyContact || { name: "Sarah Tanaka", phone: "+1 (555) 234-5678", relationship: "Spouse" });
    }
  }, [member]);

  if (!member || member.role === "client") {
    return notFound();
  }

  const assignedProjects = useMemo(() => projects.filter((p) => p.team.includes(member.id)), [projects, member.id]);
  const memberTasks = useMemo(() => tasks.filter((t) => t.assignees.includes(member.id)), [tasks, member.id]);
  
  const monthHours = useMemo(() => {
    return timeEntries
      .filter((te) => te.userId === member.id)
      .reduce((sum, te) => sum + te.hours, 0);
  }, [timeEntries, member.id]);

  const activeTasksCount = useMemo(() => {
    return memberTasks.filter((t) => t.stage !== "completed").length;
  }, [memberTasks]);

  const completedTasksCount = useMemo(() => {
    return memberTasks.filter((t) => t.stage === "completed").length;
  }, [memberTasks]);

  // Teammates: team members working on same projects as this user
  const teammates = useMemo(() => {
    const teammateIds = new Set<string>();
    assignedProjects.forEach((p) => p.team.forEach((uid) => {
      if (uid !== member.id) teammateIds.add(uid);
    }));
    return users.filter((u) => teammateIds.has(u.id) && u.role !== "client");
  }, [assignedProjects, users, member.id]);

  const handleSaveBio = () => {
    updateTeamMember(member.id, { bio });
    setIsEditingBio(false);
    toast.success("Bio updated successfully");
  };

  const handleSaveEmergency = () => {
    updateTeamMember(member.id, { emergencyContact });
    setIsEditingEmergency(false);
    toast.success("Emergency contact updated");
  };

  const handleSaveContactDetails = () => {
    updateTeamMember(member.id, {
      phone,
      timezone,
      workingHours,
      address,
      linkedin: linkedinUrl,
      github: githubUrl,
    });
    toast.success("Contact details updated");
  };

  const handleSaveNotes = (val: string) => {
    setNotes(val);
    updateTeamMember(member.id, { notes: val });
  };

  return (
    <AppShell>
      <Link
        href="/owner/team"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All team members
      </Link>

      {/* Header Panel */}
      <div className="panel p-6 bg-card/50 backdrop-blur-sm border-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-2xl font-bold text-white shadow-sm border border-white/10"
              style={{ backgroundColor: member.color || "#0049FE" }}
            >
              {member.avatar}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{member.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>{member.title}</span>
                <span className="text-muted-foreground/45">•</span>
                <span className="capitalize">{member.role}</span>
                <span className="text-muted-foreground/45">•</span>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                  assignedProjects.length > 2
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  {assignedProjects.length > 2 ? "Busy" : "Available"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => open("team.edit", { userId: member.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              <UserCog className="h-3.5 w-3.5" /> Edit Profile
            </button>
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
              onClick={() => {
                if (t.id === "projects") {
                  router.push(`/owner/projects?team=${member.id}`);
                } else if (t.id === "time") {
                  router.push(`/owner/time?member=${member.id}`);
                } else {
                  setTab(t.id);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content rendering */}
      <div className="transition-all duration-300">
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio & Details Overview */}
              <div className="panel p-6 bg-card border-border/60 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Biography & Profile</h3>
                  <button
                    onClick={() => {
                      if (isEditingBio) {
                        handleSaveBio();
                      } else {
                        setIsEditingBio(true);
                      }
                    }}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isEditingBio ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                    {isEditingBio ? "Save Bio" : "Edit Bio"}
                  </button>
                </div>

                {isEditingBio ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Write a brief profile biography..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none text-foreground"
                  />
                ) : bio ? (
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic font-medium">No biography description available.</p>
                )}

                <hr className="border-border/40" />

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact & Work Settings</h4>
                  <button
                    onClick={handleSaveContactDetails}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Save Contact Details
                  </button>
                </div>

                {/* Grid Inputs for phone, timezone, address etc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium text-foreground">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Email</label>
                    <div className="flex items-center gap-2 border border-border/50 bg-muted/20 px-3 py-2 rounded-xl text-muted-foreground text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Phone Number</label>
                    <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="bg-transparent border-0 outline-none w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Time Zone</label>
                    <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Working Hours</label>
                    <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Location Address</label>
                    <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">LinkedIn</label>
                      <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                        <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="linkedin.com/in/..."
                          className="bg-transparent border-0 outline-none w-full text-xs py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">GitHub</label>
                      <div className="flex items-center gap-2 border border-border bg-background px-3 py-1 rounded-xl text-foreground">
                        <Github className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="github.com/..."
                          className="bg-transparent border-0 outline-none w-full text-xs py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat boxes grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  label="Active Projects"
                  value={assignedProjects.length.toString()}
                  description="Assigned"
                  icon={Building2}
                  colorCls={{
                    bg: "bg-blue-500/10 text-blue-500",
                    dot: "bg-blue-500",
                    hover: "hover:bg-blue-500/[0.03] hover:border-blue-500/25",
                  }}
                />
                <StatCard
                  label="Hours Tracked"
                  value={`${monthHours.toFixed(1)}h`}
                  description="This month"
                  icon={Clock}
                  colorCls={{
                    bg: "bg-amber-500/10 text-amber-500",
                    dot: "bg-amber-500",
                    hover: "hover:bg-amber-500/[0.03] hover:border-amber-500/25",
                  }}
                />
                <StatCard
                  label="Assigned Tasks"
                  value={activeTasksCount.toString()}
                  description="Active list"
                  icon={ListTodo}
                  colorCls={{
                    bg: "bg-sky-500/10 text-sky-500",
                    dot: "bg-sky-500",
                    hover: "hover:bg-sky-500/[0.03] hover:border-sky-500/25",
                  }}
                />
                <StatCard
                  label="Tasks Completed"
                  value={completedTasksCount.toString()}
                  description="Archived done"
                  icon={Check}
                  colorCls={{
                    bg: "bg-emerald-500/10 text-emerald-500",
                    dot: "bg-emerald-500",
                    hover: "hover:bg-emerald-500/[0.03] hover:border-emerald-500/25",
                  }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Emergency Contact Card */}
              <div className="panel p-6 bg-card border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Emergency Contact</h3>
                  <button
                    onClick={() => {
                      if (isEditingEmergency) {
                        handleSaveEmergency();
                      } else {
                        setIsEditingEmergency(true);
                      }
                    }}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isEditingEmergency ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                    {isEditingEmergency ? "Save" : "Edit"}
                  </button>
                </div>

                {isEditingEmergency ? (
                  <div className="space-y-3">
                    <TextField
                      label="Contact name"
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextField
                        label="Relationship"
                        value={emergencyContact.relationship}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                      />
                      <TextField
                        label="Phone number"
                        value={emergencyContact.phone}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-semibold text-foreground">{emergencyContact.name || "Sarah Tanaka"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Relationship:</span>
                      <span className="font-semibold text-foreground">{emergencyContact.relationship || "Spouse"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-semibold text-foreground">{emergencyContact.phone || "+1 (555) 234-5678"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shared Teammates List */}
              <div className="panel p-6 bg-card border-border/60 space-y-4">
                <h3 className="text-base font-bold text-foreground">Project Teammates</h3>
                {teammates.length > 0 ? (
                  <div className="space-y-3">
                    {teammates.map((u) => (
                      <Link
                        key={u.id}
                        href={`/owner/team/${u.id}`}
                        className="flex items-center justify-between hover:bg-muted/30 p-1.5 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar user={u} size={28} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{u.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{u.title}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full capitalize text-muted-foreground">
                          {u.role}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">No teammates on assigned projects.</p>
                )}
              </div>

              {/* Notes Card */}
              <div className="panel p-6 bg-card border-border/60 space-y-4">
                <h3 className="text-base font-bold text-foreground">Manager Notes</h3>
                <RichEditor
                  value={notes}
                  onChange={handleSaveNotes}
                  placeholder="Record onboarding tasks, training reviews, or performance logs here..."
                  minHeight={150}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tasks tab implementation */}
        {tab === "tasks" && (
          <div className="panel p-6 bg-card border-border/60 rounded-3xl">
            <h3 className="text-base font-bold text-foreground mb-4">Assigned Tasks ({memberTasks.length})</h3>
            
            {memberTasks.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {memberTasks.map((t) => {
                  const proj = projects.find((p) => p.id === t.projectId);
                  const pmeta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="flex flex-wrap items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-4 rounded-2xl transition-all cursor-pointer group gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={cn("h-2.5 w-2.5 rounded-full mt-1.5 shrink-0", STAGE_META[t.stage].dot)} />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-all leading-tight truncate">{t.title}</h4>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                            {proj && <span className="font-semibold text-foreground/80">{proj.name}</span>}
                            <span>•</span>
                            <span>Due {t.dueDate || "Not set"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border", pmeta.cls)}>
                          {pmeta.label}
                        </span>
                        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold border capitalize", STAGE_META[t.stage].tone, STAGE_META[t.stage].pill)}>
                          {STAGE_META[t.stage].label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border/60 rounded-2xl">
                This team member has no assigned tasks.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Details Drawer Sheet */}
      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </AppShell>
  );
}

/* ───── Stat Card Component ───── */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  colorCls,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<any>;
  colorCls: { bg: string; dot: string; hover: string };
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/60 bg-card/75 backdrop-blur-sm p-4 transition-all duration-300 flex flex-col justify-between group select-none",
      colorCls.hover
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
          {label}
        </span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-colors group-hover:text-foreground", colorCls.bg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
        <div className="mt-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{description}</div>
      </div>
    </div>
  );
}

/* ───── Dynamic Task Details Drawer & Helpers (Ported) ───── */

function parseDateToInputVal(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const monthAbbrev = parts[0].toLowerCase().slice(0, 3);
    const month = months[monthAbbrev];
    const day = parts[1].replace(/\D/g, "").padStart(2, "0");
    if (month && day) {
      return `2026-${month}-${day}`;
    }
  }
  return "";
}

function formatToMockDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${monthNames[monthIdx]} ${day.toString().padStart(2, "0")}`;
    }
  }
  return dateStr;
}

function TaskDetailsDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const tasks = useStore((s) => s.tasks);
  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const projects = useStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.id === task?.projectId), [projects, task?.projectId]);
  const updateTask = useStore((s) => s.updateTask);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const comments = useMemo(() => allComments.filter((c) => c.threadId === taskId), [allComments, taskId]);

  const logTime = useStore((s) => s.logTime);
  const allTimeEntries = useStore((s) => s.timeEntries);
  const { open } = useModals();
  const taskEntries = useMemo(() => allTimeEntries.filter((te) => task && te.taskId === task.id), [allTimeEntries, task]);
  const taskHours = useMemo(() => taskEntries.reduce((sum, e) => sum + e.hours, 0), [taskEntries]);

  const [logHours, setLogHours] = useState<number>(0);
  const [logNote, setLogNote] = useState("");
  const [logBillable, setLogBillable] = useState(true);

  const teamMembers = users.filter((u) => u.role !== "client");

  const handleLogTime = () => {
    if (!task || logHours <= 0) return;
    logTime({
      userId: "u1", // Owner: Carina Rivera
      projectId: task.projectId,
      taskId: task.id,
      hours: logHours,
      note: logNote.trim() || `Worked on task: ${task.title}`,
      billable: logBillable,
      date: new Date().toISOString().slice(0, 10),
    });
    setLogHours(0);
    setLogNote("");
    setLogBillable(true);
    toast.success(`Logged ${logHours}h on task`);
  };

  if (!task) return null;

  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[40rem] overflow-y-auto w-full p-6 bg-card border-l border-border/80">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
          <SheetDescription className="sr-only">View and edit details for task {task.title}</SheetDescription>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", pmeta.cls)}>
              {pmeta.label}
            </span>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", STAGE_META[task.stage].tone, STAGE_META[task.stage].pill)}>
              {STAGE_META[task.stage].label}
            </span>
          </div>
          {project && (
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">
              {project.name}
            </div>
          )}
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-0 outline-none w-full focus:ring-1 focus:ring-primary rounded-xl px-1 text-foreground"
          />
          {task.createdAt && (
            <div className="text-xs text-muted-foreground mt-1.5 px-1">
              Created on{" "}
              {new Date(task.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}
        </SheetHeader>

        {/* Form fields */}
        <div className="space-y-4 text-sm border-b border-border pb-6 mb-6">
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={task.stage}
              onChange={(e) => updateTask(task.id, { stage: e.target.value as TaskStage })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              {(["todo", "in_progress", "in_review", "completed"] as TaskStage[]).map((s) => (
                <option key={s} value={s}>{STAGE_META[s].label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Priority:</span>
            <select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Due Date:</span>
            <input
              type="date"
              value={parseDateToInputVal(task.dueDate)}
              onChange={(e) => updateTask(task.id, { dueDate: formatToMockDate(e.target.value) })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Start Date:</span>
            <input
              type="date"
              value={task.startDate ?? ""}
              onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Est. Hours:</span>
            <input
              type="number"
              value={task.estimatedHours ?? 0}
              onChange={(e) => updateTask(task.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Client Priority:</span>
            <select
              value={task.customFields?.["Client Priority"] ?? "Normal"}
              onChange={(e) => {
                const nextCustom = { ...(task.customFields ?? {}), "Client Priority": e.target.value };
                updateTask(task.id, { customFields: nextCustom });
              }}
              className="col-span-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 items-start">
            <span className="text-muted-foreground font-medium pt-1">Assignees:</span>
            <div className="col-span-2 rounded-xl border border-border bg-background p-2 max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {[...teamMembers]
                .sort((a, b) => {
                  const aAssigned = task.assignees.includes(a.id);
                  const bAssigned = task.assignees.includes(b.id);
                  if (aAssigned && !bAssigned) return -1;
                  if (!aAssigned && bAssigned) return 1;
                  return 0;
                })
                .map((m) => {
                  const assigned = task.assignees.includes(m.id);
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
                            ? task.assignees.filter((id) => id !== m.id)
                            : [...task.assignees, m.id];
                          updateTask(task.id, { assignees: next });
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

          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-muted-foreground font-medium">Logged Time:</span>
            <div className="col-span-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs bg-primary/10 text-primary">
                {taskHours.toFixed(1)}h
              </span>
              <span className="text-xs text-muted-foreground">
                of {task.estimatedHours || 0}h estimated
              </span>
              {(task.estimatedHours ?? 0) > 0 && (
                <div className="flex-1 max-w-[80px] h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, (taskHours / (task.estimatedHours ?? 1)) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
          <RichEditor
            value={task.note}
            onChange={(v) => updateTask(task.id, { note: v })}
            placeholder="Add detailed description notes here..."
            minHeight={120}
          />
        </div>

        {/* Task Time Tracker Section */}
        <div className="border-t border-border/80 pt-6 mt-6 mb-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Task Time Tracker</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {taskEntries.length} {taskEntries.length === 1 ? "log" : "logs"}
            </span>
          </h4>

          {/* Form to log time inline */}
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/40 mb-4">
            <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Log Time on this Task
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="0.00"
                  value={logHours === 0 ? "" : logHours}
                  onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-foreground"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Work Done Note</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-foreground"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={logBillable}
                  onChange={(e) => setLogBillable(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                />
                Billable
              </label>

              <button
                onClick={handleLogTime}
                disabled={logHours <= 0}
                className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Log Hours
              </button>
            </div>
          </div>

          {/* Time entries list for this task */}
          {taskEntries.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {taskEntries.map((e) => {
                const u = users.find((x) => x.id === e.userId);
                if (!u) return null;
                return (
                  <div key={e.id} className="flex items-center justify-between bg-card hover:bg-muted/20 border border-border/40 p-2.5 rounded-xl transition-all group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={u} size={20} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground truncate">{u.name.split(" ")[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{e.date}</span>
                          {e.billable ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/10">Billable</span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-500/10 px-1 py-0.2 rounded border border-slate-500/10">Non-billable</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[280px]" title={e.note}>
                          {e.note || <span className="italic text-muted-foreground/30">No description note</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-lg font-mono whitespace-nowrap">{e.hours.toFixed(2)}h</span>
                      <button
                        onClick={() => open("time.delete", { timeId: e.id })}
                        className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete time entry"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
              No time entries logged on this task yet.
            </div>
          )}
        </div>

        {/* Discussion Feed */}
        <div className="border-t border-border/80 pt-6">
          <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center justify-between">
            <span>Thread Discussion</span>
            <span className="text-xs text-muted-foreground font-normal">{comments.length} comments</span>
          </h4>
          <div className="space-y-3 mb-4 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin">
            {comments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
                No discussion comments yet. Write one below!
              </div>
            ) : (
              comments.map((c) => {
                const u = users.find((x) => x.id === c.author);
                const isInternal = c.visibility === "internal";
                if (!u) return null;
                return (
                  <div key={c.id} className="flex gap-2.5 text-xs">
                    <UserAvatar user={u} size={24} />
                    <div className={cn("flex-1 rounded-2xl px-3.5 py-2.5", isInternal ? "bg-amber-500/10 border border-amber-500/25" : "bg-muted")}>
                      <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">{u.name}</span>
                        <span>{c.createdAt}</span>
                      </div>
                      <FormattedBody html={c.body} />
                      <CommentAttachmentsList attachmentIds={c.attachments} />
                      {isInternal && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                          <Lock className="h-2 w-2" /> Internal note
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form */}
          <NewCommentForm threadId={task.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewCommentForm({ threadId }: { threadId: string }) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<RichAttachment[]>([]);
  const createComment = useStore((s) => s.createComment);
  const uploadDocument = useStore((s) => s.uploadDocument);
  const projectId = useStore((s) => s.tasks.find((t) => t.id === threadId)?.projectId || "p1");

  const handleSubmit = () => {
    if (!commentText.trim() && attachments.length === 0) return;

    const docIds = attachments.map((att) => {
      const doc = uploadDocument({
        projectId,
        name: att.name,
        folder: "Attachments",
        size: formatBytes(att.size),
        shared: !isInternal,
      });
      return doc.id;
    });

    createComment({
      threadId,
      author: "u1", // Owner: Carina Rivera
      body: commentText.trim(),
      visibility: isInternal ? "internal" : "client",
      attachments: docIds,
    });
    setCommentText("");
    setAttachments([]);
    toast.success("Comment posted successfully");
  };

  const isEnabled = commentText.replace(/<[^>]+>/g, "").trim().length > 0 || attachments.length > 0;

  return (
    <RichEditor
      value={commentText}
      onChange={setCommentText}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      placeholder="Post a reply..."
      minHeight={80}
      compact
      onSend={handleSubmit}
      sendDisabled={!isEnabled}
      showInternalOnly
      isInternal={isInternal}
      onInternalChange={setIsInternal}
    />
  );
}
