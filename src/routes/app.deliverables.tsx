import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { deliverables, projects, DELIVERABLE_STATUS_META } from "@/lib/mock-data";
import { FolderOpen, MessageCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/app/deliverables")({ component: DeliverablesPage });

function DeliverablesPage() {
  return (
    <AppShell
      title="Deliverables"
      subtitle={`${deliverables.length} deliverables across all projects`}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New deliverable
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {deliverables.map((d) => {
          const project = projects.find((p) => p.id === d.projectId)!;
          return (
            <div key={d.id} className="panel overflow-hidden">
              <div className={`h-36 bg-gradient-to-br ${d.thumbnail}`} />
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DELIVERABLE_STATUS_META[d.status].cls}`}>
                    {DELIVERABLE_STATUS_META[d.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{d.version} · {d.updatedAt}</span>
                </div>
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="text-xs text-muted-foreground">{project.name}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{d.fileCount} files</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{d.feedback} comments</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
