"use client";


import { AppShell } from "@/components/app-shell";
import { FilterBar, inRange } from "@/components/filter-bar";
import { useModals } from "@/components/modals";
import { useStore } from "@/lib/store";
import { REQUEST_STATUS_META, REQUEST_TYPE_META, PRIORITY_META } from "@/lib/mock-data";
import { Plus, Wand2, CheckCircle2, XCircle, MessagesSquare } from "lucide-react";
import { useState, useMemo } from "react";



function RequestsPage() {
  const requests = useStore((s) => s.requests);
  const clients = useStore((s) => s.clients);
  const { open } = useModals();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const filterDefs = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        multi: true,
        options: Object.entries(REQUEST_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "type",
        label: "Type",
        multi: true,
        options: Object.entries(REQUEST_TYPE_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "priority",
        label: "Priority",
        multi: true,
        options: Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      {
        id: "client",
        label: "Client",
        multi: true,
        options: clients.map((c) => ({ value: c.id, label: c.name, color: c.logoColor })),
      },
    ],
    [clients],
  );

  const filtered = requests.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status?.length && !filters.status.includes(r.status)) return false;
    if (filters.type?.length && !filters.type.includes(r.type)) return false;
    if (filters.priority?.length && !filters.priority.includes(r.priority)) return false;
    if (filters.client?.length && !filters.client.includes(r.clientId)) return false;
    if (!inRange(r.submittedAt, dateRange)) return false;
    return true;
  });

  return (
    <AppShell
      title="Requests"
      subtitle={`${requests.length} requests · ${requests.filter((r) => r.status === "submitted").length} need first review`}
      actions={
        <button
          onClick={() => open("request.new")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Log request
        </button>
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search requests…"
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
        dateRange={dateRange}
        onDateRange={setDateRange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => {
          const client = clients.find((c) => c.id === r.clientId);
          const sm = REQUEST_STATUS_META[r.status];
          const tm = REQUEST_TYPE_META[r.type];
          const pm = PRIORITY_META[r.priority];
          return (
            <div key={r.id} className="panel p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => open("request.review", { requestId: r.id })}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sm.cls}`}
                >
                  {sm.label}
                </button>
                <span className="text-[11px] text-muted-foreground">{r.submittedAt}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{tm.label}</span>
                <span className={`rounded-full px-2 py-0.5 ${pm.cls}`}>{pm.label}</span>
              </div>
              <button
                onClick={() => open("request.review", { requestId: r.id })}
                className="mt-2 text-left text-sm font-semibold hover:text-primary"
              >
                {r.title}
              </button>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">{client?.name}</span>
                <div className="flex flex-wrap justify-end gap-1">
                  <button
                    onClick={() => open("request.convertTask", { requestId: r.id })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-muted"
                  >
                    <Wand2 className="h-3 w-3" /> Convert
                  </button>
                  <button
                    onClick={() => open("request.reject", { requestId: r.id })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-muted"
                  >
                    <XCircle className="h-3 w-3" /> Reject
                  </button>
                  <button
                    onClick={() => open("request.approve", { requestId: r.id })}
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
            <MessagesSquare className="h-6 w-6 text-muted-foreground/60" />
            No requests match your filters.
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default RequestsPage;
