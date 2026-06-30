"use client";

import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/lib/store";
import { AppDialog } from "@/components/ui/app-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Shield, Eye, FileDown, Search, Activity, Lock, Terminal } from "lucide-react";

// Define audit log type
type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorId: string;
  category: "Task" | "File" | "Team" | "Billing" | "Security";
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
};

// Seed mock audit log data
const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "evt-001",
    timestamp: "2026-06-29 03:10:14",
    actorId: "u1", // Carina Rivera
    category: "Billing",
    action: "Updated workspace subscription to Pro Growth Studio Plan",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    metadata: {
      action_type: "subscription_update",
      old_plan: "Growth Starter",
      new_plan: "Pro Growth Studio",
      monthly_cost: "$79.00",
      payment_method: "Visa ending in 4242",
      transaction_id: "tx_growth_88283478",
    },
  },
  {
    id: "evt-002",
    timestamp: "2026-06-28 14:32:05",
    actorId: "u2", // Mia Tanaka
    category: "Task",
    action: "Rescheduled task 'Create Avatar Component' due date in project 'NovaBoard Mobile App'",
    ipAddress: "203.0.113.88",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
    metadata: {
      action_type: "task_rescheduled",
      task_id: "p1-t3",
      task_title: "Create Avatar Component",
      project_id: "p1",
      project_name: "NovaBoard Mobile App",
      old_due_date: "Jun 18",
      new_due_date: "Jun 20",
    },
  },
  {
    id: "evt-003",
    timestamp: "2026-06-28 11:15:45",
    actorId: "u1", // Carina Rivera
    category: "File",
    action: "Connected Google Drive as workspace external storage sync provider",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    metadata: {
      action_type: "storage_connected",
      provider: "google_drive",
      admin_email: "carina@carina.studio",
      folder_path: "client-portal/",
    },
  },
  {
    id: "evt-004",
    timestamp: "2026-06-27 16:44:20",
    actorId: "u4", // Marcus Vance
    category: "Team",
    action: "Completed profile settings and activated Multi-Factor Authentication",
    ipAddress: "198.51.100.12",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    metadata: {
      action_type: "mfa_activation",
      mfa_method: "authenticator_app",
      backup_codes_generated: true,
      role: "owner",
    },
  },
  {
    id: "evt-005",
    timestamp: "2026-06-27 10:20:11",
    actorId: "u1", // Carina Rivera
    category: "Security",
    action: "Configured workspace governance to enforce Multi-Factor Authentication for all owners/team members",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    metadata: {
      action_type: "policy_update",
      policy_name: "enforce_mfa_all",
      value: "true",
      effected_accounts_count: 8,
    },
  },
  {
    id: "evt-006",
    timestamp: "2026-06-26 18:05:30",
    actorId: "u3", // Devon Lane
    category: "Task",
    action: "Logged 4.5 hours on task 'API Endpoint Mapping' in project 'NovaBoard Mobile App'",
    ipAddress: "192.168.254.120",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/121.0",
    metadata: {
      action_type: "time_logged",
      task_id: "p1-t6",
      hours: 4.5,
      billable: true,
      note: "Mapped REST controllers to GraphQL schemas.",
    },
  },
  {
    id: "evt-007",
    timestamp: "2026-06-26 12:50:08",
    actorId: "u1", // Carina Rivera
    category: "Team",
    action: "Invited Marcus Vance as Owner role in team roster settings",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    metadata: {
      action_type: "invite_member",
      invitee_email: "marcus@carina.studio",
      invitee_name: "Marcus Vance",
      assigned_role: "owner",
      invitation_link_generated: true,
    },
  },
  {
    id: "evt-008",
    timestamp: "2026-06-25 09:12:44",
    actorId: "u2", // Mia Tanaka
    category: "File",
    action: "Uploaded attachment 'landing-copy-final-v2.pdf' to comment thread",
    ipAddress: "203.0.113.88",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
    metadata: {
      action_type: "file_upload",
      file_name: "landing-copy-final-v2.pdf",
      file_size: "1.2 MB",
      thread_id: "p1-t10",
      project_id: "p1",
    },
  },
  {
    id: "evt-009",
    timestamp: "2026-06-25 08:30:00",
    actorId: "u1", // Carina Rivera
    category: "Security",
    action: "Updated global workspace session inactivity timeout configuration",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    metadata: {
      action_type: "session_timeout_update",
      old_timeout_seconds: 28800, // 8 hours
      new_timeout_seconds: 43200, // 12 hours
    },
  },
  {
    id: "evt-010",
    timestamp: "2026-06-24 15:10:22",
    actorId: "u4", // Marcus Vance
    category: "Billing",
    action: "Downloaded PDF Invoice #INV-2026-004",
    ipAddress: "198.51.100.12",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    metadata: {
      action_type: "download_invoice",
      invoice_number: "INV-2026-004",
      amount_usd: "$4,250.00",
    },
  },
];

const CATEGORY_META = {
  Task: { tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  File: { tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  Team: { tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
  Billing: { tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  Security: { tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

export default function AdminConsoleView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const users = useStore((s) => s.users);
  const teamMembers = useMemo(() => users.filter((u) => u.role !== "client"), [users]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filterDefs = useMemo(() => [
    {
      id: "actor",
      label: "Actor",
      multi: true,
      options: teamMembers.map((m) => ({ value: m.id, label: m.name, color: m.color })),
    },
    {
      id: "category",
      label: "Category",
      multi: true,
      options: [
        { value: "Task", label: "Task Actions" },
        { value: "File", label: "File Management" },
        { value: "Team", label: "Team Updates" },
        { value: "Billing", label: "Billing & Subscriptions" },
        { value: "Security", label: "Security & Governance" },
      ],
    },
  ], [teamMembers]);

  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((log) => {
      // Search check
      if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false;
      // Actor check
      if (filters.actor?.length && !filters.actor.includes(log.actorId)) return false;
      // Category check
      if (filters.category?.length && !filters.category.includes(log.category)) return false;

      return true;
    });
  }, [search, filters]);

  const handleExport = () => {
    toast.success("Successfully exported 10 audit logs to CSV!");
  };

  if (!mounted) return null;

  return (
    <AppShell
      title="Admin Console"
      subtitle="View, search, and audit system-wide user actions, file access events, and billing configuration changes."
      actions={
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <FileDown className="h-4 w-4" /> Export logs
        </button>
      }
    >
      {/* Activity Filter Bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search audit actions..."
        filters={filterDefs}
        values={filters}
        onChange={setFilters}
      />

      {/* Main Table Card */}
      <div className="panel overflow-hidden bg-card/50 backdrop-blur-sm border-border/60">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50 bg-muted/10">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Workspace Audit Logs</h3>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                <th className="px-5 py-3.5 font-semibold">Actor</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Action Performed</th>
                <th className="px-5 py-3.5 font-semibold">IP Address</th>
                <th className="px-5 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredLogs.map((log) => {
                const actor = users.find((u) => u.id === log.actorId);
                const categoryMeta = CATEGORY_META[log.category];
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Actor User */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {actor ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <UserAvatar user={actor} size={22} />
                          <span>{actor.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">System</span>
                      )}
                    </td>

                    {/* Event Category Badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                        categoryMeta?.tone || "bg-muted text-muted-foreground"
                      )}>
                        {log.category}
                      </span>
                    </td>

                    {/* Action description */}
                    <td className="px-5 py-3 text-xs text-foreground/80 max-w-sm truncate" title={log.action}>
                      {log.action}
                    </td>

                    {/* IP address */}
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {log.ipAddress}
                    </td>

                    {/* Metadata details action link */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3 text-muted-foreground/60">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-foreground text-xs">No audit events match your active filters</div>
                      <div className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
                        Try searching for other descriptions or clearing user/category filters.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Metadata details dialog */}
      <AppDialog
        open={!!selectedLog}
        onOpenChange={(v) => !v && setSelectedLog(null)}
        title="Audit Event Details"
        description="Detailed system payloads, session headers, and actor metadata associated with this event."
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 p-6 text-sm">
            {/* Quick Summary Row */}
            <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Event ID</span>
                <span className="font-semibold text-foreground font-mono text-xs">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Category</span>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border mt-0.5",
                  CATEGORY_META[selectedLog.category]?.tone
                )}>
                  {selectedLog.category}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">IP Address</span>
                <span className="font-semibold text-foreground font-mono text-xs">{selectedLog.ipAddress}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Timestamp</span>
                <span className="font-semibold text-foreground text-xs">{selectedLog.timestamp}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Description</span>
              <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 border border-border/40 p-3 rounded-xl">
                {selectedLog.action}
              </p>
            </div>

            {/* System Context */}
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Client User-Agent</span>
              <p className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/20 truncate" title={selectedLog.userAgent}>
                {selectedLog.userAgent}
              </p>
            </div>

            {/* Detailed Payload JSON */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Payload Metadata (JSON)</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-400 bg-zinc-950 p-4 rounded-xl border border-border/30 overflow-x-auto shadow-inner leading-relaxed">
                {JSON.stringify(
                  {
                    event_id: selectedLog.id,
                    timestamp: selectedLog.timestamp,
                    actor_id: selectedLog.actorId,
                    category: selectedLog.category,
                    client_ip: selectedLog.ipAddress,
                    user_agent: selectedLog.userAgent,
                    payload: selectedLog.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </AppDialog>
    </AppShell>
  );
}
