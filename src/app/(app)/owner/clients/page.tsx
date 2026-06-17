"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { Plus, Pencil, Archive, MoreHorizontal } from "lucide-react";
import { useState, useMemo } from "react";



const HEALTH_TONE: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-700",
  watch: "bg-amber-100 text-amber-700",
  "at-risk": "bg-rose-100 text-rose-700",
};

function ClientsPage() {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const industries = useMemo(
    () => Array.from(new Set(clients.map((c) => c.industry))).map((i) => ({ value: i, label: i })),
    [clients],
  );

  const filterDefs = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: [
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
          { value: "archived", label: "Archived" },
        ],
      },
      {
        id: "health",
        label: "Health",
        multi: true,
        options: [
          { value: "healthy", label: "Healthy", color: "#10B981" },
          { value: "watch", label: "Watch", color: "#F59E0B" },
          { value: "at-risk", label: "At risk", color: "#F43F5E" },
        ],
      },
      { id: "industry", label: "Industry", multi: true, options: industries },
    ],
    [industries],
  );

  const filtered = clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.contact.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filters.status?.length && !filters.status.includes(c.status)) return false;
    if (filters.health?.length && !filters.health.includes(c.health)) return false;
    if (filters.industry?.length && !filters.industry.includes(c.industry)) return false;
    return true;
  });

  return (
    <AppShell
      title="Clients"
      subtitle={`${clients.length} clients · ${clients.filter((c) => c.status === "active").length} active`}
      actions={
        <button
          onClick={() => open("client.new")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add client
        </button>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search clients…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const clientProjects = projects.filter((p) => p.clientId === c.id);
          return (
            <div key={c.id} className="panel p-5 transition-transform hover:-translate-y-0.5">
              <Link href={`/owner/clients/${c.id }`} className="block">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-semibold text-white"
                    style={{ backgroundColor: c.logoColor }}
                  >
                    {c.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-semibold">{c.name}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${HEALTH_TONE[c.health]}`}>
                        {c.health}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.industry}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Projects" value={clientProjects.length.toString()} />
                  <Stat label="Requests" value={c.openRequests.toString()} />
                  <Stat label="Hours / mo" value={c.hoursMonth.toString()} />
                </div>
              </Link>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{c.contact}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => open("client.edit", { clientId: c.id })}
                    className="rounded-full p-1.5 hover:bg-muted"
                    aria-label="Edit client"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => open("client.archive", { clientId: c.id })}
                    className="rounded-full p-1.5 hover:bg-muted"
                    aria-label="Archive client"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded-full p-1.5 hover:bg-muted" aria-label="More">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full panel grid place-items-center gap-2 p-12 text-center text-sm text-muted-foreground">
            No clients match your filters.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default ClientsPage;
