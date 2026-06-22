"use client";


import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import {
  Download,
  Eye,
  Lock,
  Upload,
  FolderPlus,
  Folder,
  ArrowRightLeft,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";



function DocumentsPage() {
  const documents = useStore((s) => s.documents);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<"list" | "grid">("list");

  const folders = useMemo(
    () => Array.from(new Set(documents.map((d) => d.folder))).map((f) => ({ value: f, label: f })),
    [documents],
  );

  const filterDefs = useMemo(
    () => [
      {
        id: "project",
        label: "Project",
        multi: true,
        options: projects.map((p) => ({ value: p.id, label: p.name })),
      },
      { id: "folder", label: "Folder", multi: true, options: folders },
      {
        id: "visibility",
        label: "Visibility",
        options: [
          { value: "shared", label: "Shared with client", color: "#10B981" },
          { value: "internal", label: "Internal", color: "#94A3B8" },
        ],
      },
    ],
    [projects, folders],
  );

  const filtered = documents
    .filter((d) => d.name !== ".keep")
    .filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.project?.length && !filters.project.includes(d.projectId)) return false;
      if (filters.folder?.length && !filters.folder.includes(d.folder)) return false;
      if (filters.visibility?.length) {
        const v = filters.visibility[0];
        if (v === "shared" && !d.shared) return false;
        if (v === "internal" && d.shared) return false;
      }
      return true;
    });

  const groupedByFolder = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    for (const d of filtered) (g[d.folder] ||= []).push(d);
    return g;
  }, [filtered]);

  return (
    <AppShell
      title="Documents"
      subtitle={`${documents.filter((d) => d.name !== ".keep").length} files across all projects`}
      actions={
        <>
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Folders
            </button>
          </div>
          <button
            onClick={() => open("doc.folder.new")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <FolderPlus className="h-4 w-4" /> New folder
          </button>
          <button
            onClick={() => open("doc.upload")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        </>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search files…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      {view === "list" ? (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Project</th>
                <th className="px-3 py-3 font-medium">Folder</th>
                <th className="px-3 py-3 font-medium">Size</th>
                <th className="px-3 py-3 font-medium">Uploaded</th>
                <th className="px-3 py-3 font-medium">Visibility</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const u = users.find((x) => x.id === d.uploadedBy);
                const p = projects.find((p) => p.id === d.projectId);
                return (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {d.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p?.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{d.folder}</td>
                    <td className="px-3 py-3 text-muted-foreground">{d.size}</td>
                    <td className="px-3 py-3 text-muted-foreground">{u?.name.split(" ")[0]} · {d.uploadedAt}</td>
                    <td className="px-3 py-3">
                      {d.shared ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <Eye className="h-3 w-3" /> Client
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" /> Internal
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => open("doc.move", { docId: d.id })}
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="Move file"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => open("doc.delete", { docId: d.id })}
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Download">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No files match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(groupedByFolder).map(([folder, files]) => (
            <div key={folder} className="panel p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{folder}</div>
                    <div className="text-[11px] text-muted-foreground">{files.length} files</div>
                  </div>
                </div>
                <button
                  onClick={() => open("doc.folder.rename", { folder })}
                  className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Rename
                </button>
              </div>
              <ul className="mt-3 space-y-1">
                {files.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-xs hover:bg-muted">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{f.size}</span>
                  </li>
                ))}
                {files.length > 5 && (
                  <li className="px-2 text-[11px] text-muted-foreground">+ {files.length - 5} more</li>
                )}
              </ul>
            </div>
          ))}
          {Object.keys(groupedByFolder).length === 0 && (
            <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              No folders match your filters.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default DocumentsPage;
