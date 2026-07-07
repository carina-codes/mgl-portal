"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Inbox,
  FileText,
  MessageCircle,
  MessageSquare,
  UserCog,
  Clock,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  Folder,
  Home,
  FolderOpen,
  Send,
} from "lucide-react";
import { useRole, useCurrentUser } from "@/lib/role-context";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  User,
  CircleUser,
  Shield,
  Keyboard,
  ExternalLink,
  Check,
  Trash2,
  Upload,
  CircleDot,
  FileCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useModals } from "@/components/modals";
import { AppDialog } from "@/components/ui/app-dialog";
import { SearchDropdown } from "./search-dropdown";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const NAV = [
  { to: "/owner", label: "Overview", icon: Home, exact: true },
  { to: "/owner/clients", label: "Clients", icon: Users },
  { to: "/owner/projects", label: "Projects", icon: FolderOpen },
  { to: "/owner/messages", label: "Messages", icon: MessageSquare },
  { to: "/owner/requests", label: "Requests", icon: Send },
  { to: "/owner/team", label: "Team", icon: UserCog },
];

const statusConfig = {
  online: { color: "bg-emerald-500", label: "Online" },
  away: { color: "bg-amber-400", label: "Away" },
  dnd: { color: "bg-red-500", label: "Busy" },
} as const;

const roleBadge = {
  owner: { label: "Owner", class: "bg-primary/15 text-primary" },
  team: { label: "Team", class: "bg-blue-500/15 text-blue-600" },
  client: { label: "Client", class: "bg-emerald-500/15 text-emerald-600" },
} as const;

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "request" | "upload" | "comment" | "payment" | "milestone";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "New change request",
    description: "Elena Marchetti (Client) requested revisions on NovaBoard Web App UI.",
    time: "1 hour ago",
    read: false,
    type: "request",
  },
  {
    id: "n2",
    title: "Mia Tanaka uploaded assets",
    description: "Uploaded 3 new design concepts to the NovaBoard iOS App project.",
    time: "3 hours ago",
    read: false,
    type: "upload",
  },
  {
    id: "n3",
    title: "New feedback comment",
    description: "Elena Marchetti commented on the Marketing Site Copy draft.",
    time: "5 hours ago",
    read: false,
    type: "comment",
  },
  {
    id: "n4",
    title: "Payment received",
    description: "Invoice #INV-2026-004 ($4,250.00) has been paid by Elena Marchetti.",
    time: "Yesterday",
    read: true,
    type: "payment",
  },
  {
    id: "n5",
    title: "Milestone achieved",
    description: "Project NovaBoard iOS App is now 75% complete.",
    time: "2 days ago",
    read: true,
    type: "milestone",
  },
];

const getNotificationTypeConfig = (type: NotificationItem["type"]) => {
  switch (type) {
    case "request":
      return { icon: Inbox, color: "text-blue-500 bg-blue-500/10" };
    case "upload":
      return { icon: Upload, color: "text-purple-500 bg-purple-500/10" };
    case "comment":
      return { icon: MessageSquare, color: "text-amber-500 bg-amber-500/10" };
    case "payment":
      return { icon: FileCheck, color: "text-emerald-500 bg-emerald-500/10" };
    case "milestone":
      return { icon: CircleDot, color: "text-pink-500 bg-pink-500/10" };
  }
};

let globalMounted = false;
let globalCollapsed = false;
let globalTheme: "light" | "dark" = "light";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname() || "";
  const { role, setRole } = useRole();
  const user = useCurrentUser();
  const router = useRouter();
  const { open } = useModals();
  const [theme, setTheme] = useState<"light" | "dark">(globalMounted ? globalTheme : "light");
  const [status, setStatus] = useState<"online" | "away" | "dnd">("online");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    let lastKey = "";
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName) ||
          activeEl.hasAttribute("contenteditable") ||
          activeEl.getAttribute("role") === "textbox");

      if (isInput) return;

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((o) => !o);
        return;
      }

      if (e.key === "Escape") {
        setIsShortcutsOpen(false);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        open("project.new");
        return;
      }
      if (key === "c") {
        e.preventDefault();
        open("time.log");
        return;
      }

      if (lastKey === "g") {
        lastKey = "";
        if (key === "d") {
          e.preventDefault();
          router.push("/owner");
        } else if (key === "p") {
          e.preventDefault();
          router.push("/owner/projects");
        } else if (key === "c") {
          e.preventDefault();
          router.push("/owner/clients");
        } else if (key === "t") {
          e.preventDefault();
          router.push("/owner/team");
        } else if (key === "f") {
          e.preventDefault();
          router.push("/owner/files");
        } else if (key === "r") {
          e.preventDefault();
          router.push("/owner/requests");
        } else if (key === "s") {
          e.preventDefault();
          router.push("/owner/settings");
        }
        return;
      }

      if (key === "g") {
        lastKey = "g";
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(() => {
          lastKey = "";
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, [router, open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const toggleRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !n.read;
    return true;
  });

  const [mounted, setMounted] = useState(globalMounted);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const resolvedTheme = isDark ? "dark" : "light";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setTheme(resolvedTheme);
    globalTheme = resolvedTheme;
    globalMounted = true;
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
      globalTheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
      globalTheme = "light";
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                C
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-tight leading-none">Carina</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">Internal Workspace</div>
              </div>
            </div>

            {/* Center: Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.to
                  : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/client"
                className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground md:inline"
              >
                Switch to client
              </Link>
              <Link href="/client/settings" className="hover:opacity-90 transition-opacity cursor-pointer flex shrink-0">
                <UserAvatar user={user} size={36} />
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="mx-auto max-w-6xl px-6 py-8">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
                )}
                {subtitle && (
                  <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    
    <AppDialog
      open={isShortcutsOpen}
      onOpenChange={setIsShortcutsOpen}
      title="Keyboard Shortcuts"
      description="Navigate and execute global actions instantly across the workspace."
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 text-sm">
        {/* Navigation Category */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Keyboard className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-foreground">Navigation</h4>
          </div>
          <div className="space-y-3">
            <ShortcutRow keys={["g", "d"]} label="Go to Dashboard" />
            <ShortcutRow keys={["g", "p"]} label="Go to Projects" />
            <ShortcutRow keys={["g", "c"]} label="Go to Clients" />
            <ShortcutRow keys={["g", "t"]} label="Go to Team" />
            <ShortcutRow keys={["g", "f"]} label="Go to Files" />
            <ShortcutRow keys={["g", "r"]} label="Go to Requests" />
            <ShortcutRow keys={["g", "s"]} label="Go to Settings" />
          </div>
        </div>

        {/* Actions Category */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-foreground">Global Actions</h4>
          </div>
          <div className="space-y-3">
            <ShortcutRow keys={["n"]} label="Create New Project" />
            <ShortcutRow keys={["c"]} label="Log Work Time" />
            <ShortcutRow keys={["?"]} label="Show Keyboard Shortcuts Help" />
            <ShortcutRow keys={["Esc"]} label="Close Active Modals / Drawers" />
          </div>
        </div>
      </div>
    </AppDialog>
  </TooltipProvider>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((k, idx) => (
          <span key={k} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-[10px] text-muted-foreground/30">+</span>}
            <kbd className="inline-flex h-5 items-center justify-center rounded bg-muted px-1.5 font-mono text-[9px] font-bold text-foreground border border-border shadow-sm">
              {k}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PageHint({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
      <Sparkles className="h-3 w-3" /> {children}
    </div>
  );
}
