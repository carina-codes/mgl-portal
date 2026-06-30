"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import { useModals } from "@/components/modals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ListTodo,
  Check,
  X,
  Lock,
  Trash2,
  Settings,
  Cloud,
  Sparkles,
} from "lucide-react";
import {
  STAGE_META,
  PRIORITY_META,
  type TaskStage,
  type Task,
} from "@/lib/mock-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppDialog, TextField, FieldGroup } from "@/components/ui/app-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { RichEditor, formatBytes, type RichAttachment } from "@/components/rich-editor";
import { FormattedBody, CommentAttachmentsList } from "@/components/formatted-body";

// Month names list
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CALENDAR_PROVIDERS = [
  { id: "gcal", name: "Google Calendar", desc: "Sync tasks and milestones to your Google Calendar.", logo: Cloud, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "outlook", name: "Outlook Calendar", desc: "Integrate with Microsoft 365 / Outlook Calendar.", logo: CalendarIcon, color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
  { id: "apple", name: "Apple iCloud Calendar", desc: "Link Apple iCloud Calendar for iOS/Mac sync.", logo: Sparkles, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
];

function CalendarView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const users = useStore((s) => s.users);
  const updateTask = useStore((s) => s.updateTask);

  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const projectParam = searchParams.get("project");

  // Initializing filters state
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const today = new Date();
    return {
      month: [String(today.getMonth())],
      year: [String(today.getFullYear())],
      client: clientParam ? [clientParam] : [],
      project: projectParam ? [projectParam] : [],
    };
  });

  // Calendar connection state
  const [connectedCalendar, setConnectedCalendar] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("connected_calendar");
    }
    return null;
  });
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [connectEmail, setConnectEmail] = useState("");

  // Sync parameters if changed from URL
  useEffect(() => {
    if (clientParam) {
      setFilters((prev) => ({ ...prev, client: [clientParam] }));
    }
    if (projectParam) {
      setFilters((prev) => ({ ...prev, project: [projectParam] }));
    }
  }, [clientParam, projectParam]);

  // Selected Month & Year helper values
  const currentMonth = useMemo(() => {
    const val = filters.month?.[0];
    return val !== undefined ? parseInt(val, 10) : new Date().getMonth();
  }, [filters.month]);

  const currentYear = useMemo(() => {
    const val = filters.year?.[0];
    return val !== undefined ? parseInt(val, 10) : new Date().getFullYear();
  }, [filters.year]);

  // Filter definitions for the filter bar
  const filteredProjectsOptionList = useMemo(() => {
    const selectedClients = filters.client ?? [];
    if (selectedClients.length === 0) return projects;
    return projects.filter((p) => selectedClients.includes(p.clientId));
  }, [projects, filters.client]);

  const filterDefs = useMemo(() => [
    {
      id: "month",
      label: "Month",
      options: monthNames.map((name, idx) => ({ value: String(idx), label: name })),
    },
    {
      id: "year",
      label: "Year",
      options: ["2025", "2026", "2027", "2028"].map((yr) => ({ value: yr, label: yr })),
    },
    {
      id: "client",
      label: "Client",
      multi: true,
      options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
    },
    {
      id: "project",
      label: "Project",
      multi: true,
      options: filteredProjectsOptionList.map((p) => ({ value: p.id, label: p.name })),
    },
  ], [clients, filteredProjectsOptionList]);

  // Sync calendar nav controls back to filter state
  const prevMonth = () => {
    if (currentMonth === 0) {
      setFilters((prev) => ({
        ...prev,
        month: ["11"],
        year: [String(currentYear - 1)],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        month: [String(currentMonth - 1)],
      }));
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setFilters((prev) => ({
        ...prev,
        month: ["0"],
        year: [String(currentYear + 1)],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        month: [String(currentMonth + 1)],
      }));
    }
  };

  const setToday = () => {
    const today = new Date();
    setFilters((prev) => ({
      ...prev,
      month: [String(today.getMonth())],
      year: [String(today.getFullYear())],
    }));
  };

  // Connect & Disconnect handlers
  const handleConnectProvider = (providerName: string) => {
    setConnectedCalendar(providerName);
    if (typeof window !== "undefined") {
      localStorage.setItem("connected_calendar", providerName);
    }
    toast.success(`Successfully connected to ${providerName}!`);
    setConnectingProvider(null);
    setConnectDialogOpen(false);
    setConnectEmail("");
  };

  const handleDisconnect = () => {
    setConnectedCalendar(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("connected_calendar");
    }
    toast.success("Calendar disconnected successfully.");
  };

  // Filter tasks based on Search query, Client dropdown and Project dropdown
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Client filter
      if (filters.client?.length) {
        const proj = projects.find((p) => p.id === t.projectId);
        if (!proj || !filters.client.includes(proj.clientId)) return false;
      }
      // 2. Project filter
      if (filters.project?.length) {
        if (!filters.project.includes(t.projectId)) return false;
      }
      // 3. Search query
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [tasks, projects, filters.client, filters.project, search]);

  // Generate days layout for calendar
  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const arr: Array<{ day: number; currentMonth: boolean; year: number; dateString: string }> = [];

    // Preceding month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      arr.push({
        day: dayNum,
        currentMonth: false,
        year: pYear,
        dateString: `${monthNames[pMonth].slice(0, 3)} ${dayNum.toString().padStart(2, "0")}`,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      arr.push({
        day: d,
        currentMonth: true,
        year: currentYear,
        dateString: `${monthNames[currentMonth].slice(0, 3)} ${d.toString().padStart(2, "0")}`,
      });
    }

    // Succeeding month padding
    const remaining = 42 - arr.length;
    for (let d = 1; d <= remaining; d++) {
      const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      arr.push({
        day: d,
        currentMonth: false,
        year: nYear,
        dateString: `${monthNames[nMonth].slice(0, 3)} ${d.toString().padStart(2, "0")}`,
      });
    }

    return arr;
  }, [currentYear, currentMonth]);

  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const todayDate = useMemo(() => new Date(), []);

  if (!mounted) return null;

  return (
    <AppShell
      title={`Calendar – ${monthNames[currentMonth]} ${currentYear}`}
      subtitle="Centralized schedule of tasks and deliverables across all clients and projects. Drag cards to reschedule."
      actions={
        <>
          {connectedCalendar ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer">
                  <Check className="h-4 w-4" /> Connected: {connectedCalendar}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border border-border bg-card">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase">Calendar Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.success("Calendar synced successfully.")} className="cursor-pointer">
                  Sync now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-500/5">
                  Disconnect Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => setConnectDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Connect Calendar
            </button>
          )}
        </>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search tasks..."
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      <div className="panel p-5 bg-card border-border/60 rounded-3xl">
        {/* Header section with active Month/Year and navigation buttons */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
              <CalendarIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-none">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">Drag and drop cards to reschedule tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-1 border border-border/80 rounded-xl p-1 bg-muted/20">
            <button onClick={prevMonth} className="h-7 w-7 flex items-center justify-center hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={setToday}
              className="px-3 h-7 flex items-center justify-center text-xs font-bold hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Today
            </button>
            <button onClick={nextMonth} className="h-7 w-7 flex items-center justify-center hover:bg-background rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1.5 bg-muted/40 rounded-2xl p-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-3">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 bg-muted/5 p-1.5 rounded-2xl border border-border/50">
          {days.map((cell, idx) => {
            const cellTasks = filteredTasks.filter((t) => {
              if (!t.dueDate) return false;
              // Verify task year matches cell year
              if (getTaskYear(t) !== cell.year) return false;

              // Normalize date strings
              const cellClean = cell.dateString.toLowerCase().replace(/\s+/g, "").replace(/\s*0(\d)/, "$1");
              const taskClean = t.dueDate.toLowerCase().replace(/\s+/g, "").replace(/\s*0(\d)/, "$1");
              return cellClean === taskClean;
            });

            const isToday =
              todayDate.getFullYear() === currentYear &&
              todayDate.getMonth() === currentMonth &&
              cell.currentMonth &&
              cell.day === todayDate.getDate();

            return (
              <div
                key={idx}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragTaskId) {
                    updateTask(dragTaskId, { dueDate: cell.dateString });
                    toast.success(`Task rescheduled to ${cell.dateString}`);
                    setDragTaskId(null);
                  }
                }}
                className={cn(
                  "min-h-[125px] rounded-xl border p-2 bg-card flex flex-col transition-all relative",
                  !cell.currentMonth
                    ? "bg-muted/10 text-muted-foreground/40 border-border/20 border-dashed"
                    : "border-border/40 hover:border-primary/20 hover:bg-muted/5",
                  isToday && "ring-2 ring-primary/40 border-primary bg-primary/5"
                )}
              >
                {/* Cell Header */}
                <div className="flex justify-between items-center mb-2 select-none">
                  {isToday ? (
                    <span className="h-5.5 w-5.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                      {cell.day}
                    </span>
                  ) : (
                    <span className={cn(
                      "text-[10px] font-semibold",
                      cell.currentMonth ? "text-foreground/80" : "text-muted-foreground/45"
                    )}>
                      {cell.day}
                    </span>
                  )}
                  {cellTasks.length > 0 && (
                    <span className="text-[9px] font-medium text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-md leading-none">
                      {cellTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks List */}
                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin">
                  {cellTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDragTaskId(t.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[11px] font-semibold whitespace-normal line-clamp-2 break-words leading-snug cursor-pointer transition-all border border-border/30 hover:scale-[1.01] active:scale-95 flex items-start gap-1.5",
                          STAGE_META[t.stage].tone,
                          STAGE_META[t.stage].pill
                        )}
                        title={t.title}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full mt-1 shrink-0", STAGE_META[t.stage].dot)} />
                        <span className="truncate flex-1">
                          {t.title}
                          {proj && (
                            <span className="block text-[9px] font-normal text-muted-foreground mt-0.5 truncate">
                              {proj.name}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

      {/* Connect Calendar Dialog */}
      <AppDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        title="Connect Calendar Link"
        description="Choose a calendar client to sync your project milestones and task schedules."
      >
        <div className="space-y-4 p-6">
          {!connectingProvider ? (
            <div className="grid grid-cols-1 gap-4">
              {CALENDAR_PROVIDERS.map((prov) => {
                const Icon = prov.logo;
                return (
                  <button
                    key={prov.id}
                    onClick={() => setConnectingProvider(prov.id)}
                    className="panel p-4 bg-card border-border/60 flex items-center justify-between hover:border-primary/30 transition-all text-left w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border shrink-0", prov.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{prov.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{prov.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary">Connect</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!connectEmail) return;
                const provName = CALENDAR_PROVIDERS.find((p) => p.id === connectingProvider)?.name || "";
                handleConnectProvider(provName);
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setConnectingProvider(null)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  &larr; Back to providers
                </button>
              </div>
              <FieldGroup>
                <TextField
                  label="Email address"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                />
              </FieldGroup>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setConnectingProvider(null);
                    setConnectEmail("");
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer"
                >
                  Connect Calendar Link
                </button>
              </div>
            </form>
          )}
        </div>
      </AppDialog>
    </AppShell>
  );
}

// Wrap CalendarView in Suspense to prevent NextJS static compilation issues when parsing searchParams
export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarView />
    </Suspense>
  );
}

/* ───── Task Details Drawer & Helpers ───── */

function getTaskYear(t: Task): number {
  if (t.startDate && t.startDate.includes("-")) {
    const parts = t.startDate.split("-");
    const y = parseInt(parts[0], 10);
    if (!isNaN(y)) return y;
  }
  // Fallback to 2026 since all seed data is for 2026
  return 2026;
}

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
