import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { documents, projects, users } from "@/lib/mock-data";
import { Download, Eye, Lock, Upload } from "lucide-react";

export const Route = createFileRoute("/app/documents")({ component: DocumentsPage });

function DocumentsPage() {
  return (
    <AppShell
      title="Documents"
      subtitle={`${documents.length} files across all projects`}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> Upload
        </button>
      }
    >
      <div className="panel p-2">
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
            {documents.map((d) => {
              const u = users.find((x) => x.id === d.uploadedBy)!;
              const p = projects.find((p) => p.id === d.projectId)!;
              return (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3 font-medium">{d.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.folder}</td>
                  <td className="px-3 py-3 text-muted-foreground">{d.size}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.name.split(" ")[0]} · {d.uploadedAt}</td>
                  <td className="px-3 py-3">
                    {d.shared ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Eye className="h-3 w-3" /> Client</span> : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Internal</span>}
                  </td>
                  <td className="px-3 py-3 text-right"><button className="rounded-full p-1.5 hover:bg-muted"><Download className="h-3.5 w-3.5" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
