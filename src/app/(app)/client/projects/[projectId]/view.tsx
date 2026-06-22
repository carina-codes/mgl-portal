"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { projects, PROJECT_STATUS_META, tasksByProject, STAGE_META } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";



function PortalProjectDetail() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();
  const tlist = tasksByProject(projectId);

  return (
    <PortalShell>
      <Link href="/client/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="panel p-6">
        <div className="flex items-start gap-4">
          <div className={`h-14 w-14 rounded-2xl bg-${project.accent}`} />
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {project.startDate} – {project.endDate}
              <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_META[project.status].cls}`}>
                {PROJECT_STATUS_META[project.status].label}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{project.description}</p>
        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Project progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {(["todo", "in_progress", "in_review", "completed"] as const).map((s) => (
          <div key={s} className={`${STAGE_META[s].tone} rounded-2xl p-4`}>
            <div className={`text-[11px] font-semibold ${STAGE_META[s].pill}`}>{STAGE_META[s].label}</div>
            <div className="mt-1 text-2xl font-semibold">{tlist.filter((t) => t.stage === s).length}</div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}

export default PortalProjectDetail;
