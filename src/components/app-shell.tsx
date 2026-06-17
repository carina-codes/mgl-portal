"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Inbox,
  PackageCheck,
  FileText,
  MessageSquare,
  UserCog,
  Clock,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
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
import { SearchDialog } from "./search-dialog";

const NAV = [
  { to: "/owner", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/owner/clients", label: "Clients", icon: Users },
  { to: "/owner/projects", label: "Projects", icon: FolderKanban },
  { to: "/owner/requests", label: "Requests", icon: Inbox, badge: 4 },
  { to: "/owner/deliverables", label: "Deliverables", icon: PackageCheck },
  { to: "/owner/documents", label: "Documents", icon: FileText },
  { to: "/owner/messages", label: "Messages", icon: MessageSquare, badge: 6 },
  { to: "/owner/time", label: "Time tracking", icon: Clock },
  { to: "/owner/reporting", label: "Reporting", icon: BarChart3 },
  { to: "/owner/team", label: "Team", icon: UserCog },
];

const statusConfig = {
  online: { color: "bg-emerald-500", label: "Online" },
  away: { color: "bg-amber-400", label: "Away" },
  dnd: { color: "bg-red-500", label: "Do not disturb" },
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [status, setStatus] = useState<"online" | "away" | "dnd">("online");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [searchOpen, setSearchOpen] = useState(false);

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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
          <div className="flex items-center gap-2 px-2 pb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              M
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">MGL</div>
              <div className="text-[11px] text-muted-foreground">Client Platform</div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-2">
            <Link
              href="/owner/settings"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            {/* Role switcher */}
            <div className="rounded-2xl border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Previewing as
              </div>
              <div className="mt-1.5 flex gap-1 rounded-full bg-card p-0.5 text-[11px]">
                {(["owner", "team", "client"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      window.location.href = `/${r}`;
                    }}
                    className={cn(
                      "flex-1 rounded-full px-2 py-1 font-medium capitalize transition-colors",
                      role === r
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur-xl">
            <button
              onClick={() => setSearchOpen(true)}
              className="relative flex h-10 w-full max-w-md items-center rounded-full border border-border bg-card pl-10 pr-16 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-all focus:outline-none"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <span className="text-muted-foreground">Search projects, clients, tasks...</span>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative grid h-10 w-10 place-items-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-all focus:outline-none data-[state=open]:bg-muted data-[state=open]:text-foreground">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0 rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Mark all as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Clear all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                {notifications.length > 0 && (
                  <div className="flex border-b border-border bg-muted/20 px-3 py-1.5 text-xs">
                    <button
                      onClick={() => setNotifFilter("all")}
                      className={cn(
                        "rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer",
                        notifFilter === "all"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setNotifFilter("unread")}
                      className={cn(
                        "rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ml-1",
                        notifFilter === "unread"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                )}

                {/* List */}
                <div className="max-h-[360px] overflow-y-auto scrollbar-thin divide-y divide-border/50">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => {
                      const config = getNotificationTypeConfig(notif.type);
                      const IconComponent = config.icon;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => toggleRead(notif.id)}
                          className={cn(
                            "group flex gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-muted/40",
                            !notif.read && "bg-primary/[0.02]"
                          )}
                        >
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.color)}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-xs font-semibold leading-normal", !notif.read ? "text-foreground" : "text-foreground/80")}>
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">{notif.time}</span>
                                {!notif.read && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-normal line-clamp-2">
                              {notif.description}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/40 text-muted-foreground/60">
                        <Bell className="h-5 w-5" />
                      </div>
                      <h4 className="mt-3 font-semibold text-xs text-foreground/80">All caught up</h4>
                      <p className="mt-1 text-[11px] text-muted-foreground max-w-[200px]">
                        {notifFilter === "unread"
                          ? "You don't have any unread notifications."
                          : "No new notifications at the moment."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border bg-muted/10 px-4 py-2.5 text-center">
                  <Link
                    href="/owner/settings"
                    className="inline-block text-[11px] font-medium text-primary hover:underline"
                  >
                    View all notification settings
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full bg-card border border-border py-1 pr-3 pl-1 transition-all hover:bg-muted cursor-pointer focus:outline-none">
                  <div className="relative">
                    <UserAvatar user={user} size={32} />
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-card",
                        statusConfig[status].color,
                      )}
                    />
                  </div>
                  <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-1.5">
                {/* User info header */}
                <DropdownMenuLabel className="font-normal px-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <UserAvatar user={user} size={44} />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                          statusConfig[status].color,
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{user.name}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            roleBadge[role].class,
                          )}
                        >
                          {roleBadge[role].label}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                      <div className="truncate text-[11px] text-muted-foreground/70">{user.title}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="-mx-1.5" />

                {/* Status selector */}
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </div>
                  <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
                    {(["online", "away", "dnd"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStatus(s);
                        }}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all cursor-pointer",
                          status === s
                            ? "bg-popover shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig[s].color)} />
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="-mx-1.5" />

                {/* Main links */}
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/owner/settings" className="cursor-pointer flex items-center w-full px-3 py-2">
                      <CircleUser className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">My profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/owner/settings" className="cursor-pointer flex items-center w-full px-3 py-2">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">Settings</span>
                      <DropdownMenuShortcut className="text-[10px]">⌘,</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/owner/team" className="cursor-pointer flex items-center w-full px-3 py-2">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">Team</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="-mx-1.5" />

                {/* Preferences */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="cursor-pointer flex items-center px-3 py-2"
                  >
                    {theme === "light" ? (
                      <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1">Appearance</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {theme === "light" ? "Light" : "Dark"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center px-3 py-2">
                    <Keyboard className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">Keyboard shortcuts</span>
                    <DropdownMenuShortcut className="text-[10px]">?</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center px-3 py-2">
                    <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">Help & support</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="-mx-1.5" />

                {/* Workspace & Sign out */}
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer flex items-center px-3 py-2">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Admin console</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center px-3 py-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="-mx-1.5" />

                {/* Footer info */}
                <DropdownMenuLabel className="font-normal px-3 py-2 rounded-b-md bg-muted/20">
                  <div className="text-[10px] text-muted-foreground">
                    MGL Client Platform · v2.4.0
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page */}
          <main className="px-6 py-6 lg:px-8 lg:py-8">
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
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
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
