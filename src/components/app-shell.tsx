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

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/requests", label: "Requests", icon: Inbox, badge: 4 },
  { to: "/app/deliverables", label: "Deliverables", icon: PackageCheck },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/messages", label: "Messages", icon: MessageSquare, badge: 6 },
  { to: "/app/time", label: "Time tracking", icon: Clock },
  { to: "/app/reporting", label: "Reporting", icon: BarChart3 },
  { to: "/app/team", label: "Team", icon: UserCog },
];

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
              href="/app/settings"
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
                      if (r === "client") window.location.href = "/portal";
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search projects, clients, tasks..."
                className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-16 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <button className="relative grid h-10 w-10 place-items-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-card border border-border py-1 pr-3 pl-1">
              <UserAvatar user={user} size={32} />
              <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
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
