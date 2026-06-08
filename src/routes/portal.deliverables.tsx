import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { deliverables, projects, DELIVERABLE_STATUS_META } from "@/lib/mock-data";

export const Route = createFileRoute("/portal/deliverables")({ component: PortalDeliverables });

function PortalDeliverables() {
  const myProjectIds = projects.filter((p) => p.clientId === "c1").map((p) => p.id);
  const items = deliverables.filter((d) => myProjectIds.includes(d.projectId));

  return (
    <PortalShell title="Deliverables" subtitle="Review, approve, or request revisions">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((d) => (
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
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-full border border-border py-1.5 text-xs hover:bg-muted">Request revision</button>
                <button className="flex-1 rounded-full bg-primary py-1.5 text-xs font-medium text-primary-foreground">Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
