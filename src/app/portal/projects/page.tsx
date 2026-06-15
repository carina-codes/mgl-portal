"use client";

import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { projects, clients, PROJECT_STATUS_META } from "@/lib/mock-data";



function PortalProjects() {
  const myProjects = projects.filter((p) => p.clientId === "c1");
  const client = clients.find((c) => c.id === "c1")!;
  return (
    <PortalShell title="Projects" subtitle={`${myProjects.length} projects with ${client.name.split(" ")[0]} team`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {myProjects.map((p) => (
          <Link
            key={p.id}
            href={`/portal/projects/${p.id }`}
            className="panel p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className={`h-24 w-full rounded-2xl bg-${p.accent}`} />
            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[p.status].cls}`}>
                {PROJECT_STATUS_META[p.status].label}
              </span>
            </div>
            <div className="mt-2 text-base font-semibold">{p.name}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{p.progress}%</span>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}

export default PortalProjects;
