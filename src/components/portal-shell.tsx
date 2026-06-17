"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, MessageSquare, PackageCheck, Send } from "lucide-react";
import { useRole, useCurrentUser } from "@/lib/role-context";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/app/client", label: "Overview", icon: Home, exact: true },
  { to: "/app/client/projects", label: "Projects", icon: FolderOpen },
  { to: "/app/client/deliverables", label: "Deliverables", icon: PackageCheck },
  { to: "/app/client/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/client/requests", label: "Requests", icon: Send },
];

export function PortalShell({
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
  const user = useCurrentUser();
  const { setRole } = useRole();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              M
            </div>
            <div>
              <div className="text-sm font-semibold">MGL Portal</div>
              <div className="text-[11px] text-muted-foreground">Welcome back, {user.name.split(" ")[0]}</div>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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
            <button
              onClick={() => {
                setRole("owner");
                window.location.href = "/app/owner";
              }}
              className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground md:inline"
            >
              Switch to internal
            </button>
            <UserAvatar user={user} size={36} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {title && <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>}
              {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
