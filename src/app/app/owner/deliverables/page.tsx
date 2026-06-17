"use client";


import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { DELIVERABLE_STATUS_META } from "@/lib/mock-data";
import { FolderOpen, MessageCircle, Plus, CheckCircle2, RefreshCw, Pencil } from "lucide-react";
import { useState, useMemo } from "react";



function DeliverablesPage() {
  const deliverables = useStore((s) => s.deliverables);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const filterDefs = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: Object.entries(DELIVERABLE_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "project",
        label: "Project",
        multi: true,
        options: projects.map((p) => ({ value: p.id, label: p.name })),
      },
      {
        id: "client",
        label: "Client",
        multi: true,
        options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
      },
    ],
    [projects, clients],
  );

  const filtered = deliverables.filter((d) => {
    const project = projects.find((p) => p.id === d.projectId);
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(d.status)) return false;
    if (filters.project?.length && !filters.project.includes(d.projectId)) return false;
    if (filters.client?.length && (!project || !filters.client.includes(project.clientId))) return false;
    return true;
  });

  return (
    <AppShell
      title="Deliverables"
      subtitle={`${deliverables.length} deliverables across all projects`}
      actions={
        <button
          onClick={() => open("deliverable.upload")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New deliverable
        </button>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search deliverables…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => {
          const project = projects.find((p) => p.id === d.projectId);
          return (
            <div key={d.id} className="panel overflow-hidden">
              <button
                onClick={() => open("deliverable.edit", { deliverableId: d.id })}
                className={`block h-36 w-full bg-gradient-to-br ${d.thumbnail}`}
                aria-label="Open deliverable"
              />
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DELIVERABLE_STATUS_META[d.status].cls}`}>
                    {DELIVERABLE_STATUS_META[d.status].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{d.version} · {d.updatedAt}</span>
                </div>
                <div className="text-sm font-semibold">{d.title}</div>
                <div className="text-xs text-muted-foreground">{project?.name}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3" />{d.fileCount} files</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{d.feedback} comments</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3">
                  <button
                    onClick={() => open("deliverable.edit", { deliverableId: d.id })}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => open("deliverable.revision", { deliverableId: d.id })}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    <RefreshCw className="h-3 w-3" /> Revision
                  </button>
                  <button
                    onClick={() => open("deliverable.approve", { deliverableId: d.id })}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
            No deliverables match your filters.
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default DeliverablesPage;
