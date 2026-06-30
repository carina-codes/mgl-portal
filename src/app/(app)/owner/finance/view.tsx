"use client";

import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { useStore } from "@/lib/store";
import { AppDialog, TextField, SelectField, FieldGroup, FieldLabel } from "@/components/ui/app-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  CreditCard,
  Plus,
  TrendingUp,
  Coins,
  Receipt,
  Clock,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  FileCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Model declarations
type InvoiceStatus = "paid" | "sent" | "overdue" | "draft";
type ExpenseCategory = "Software" | "Contractors" | "Marketing" | "Travel" | "Office";

interface Invoice {
  id: string;
  clientName: string;
  projectName: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
}

interface Expense {
  id: string;
  merchant: string;
  category: ExpenseCategory;
  amount: number;
  status: "approved" | "pending";
  date: string;
}

const TABS = [
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "analytics", label: "Revenue Analytics", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Seed initial mockup data
const INITIAL_INVOICES: Invoice[] = [
  { id: "INV-2026-001", clientName: "Arcadia Solutions", projectName: "NovaBoard Web App", amount: 12500, status: "paid", issuedDate: "2026-06-01", dueDate: "2026-06-15" },
  { id: "INV-2026-002", clientName: "NovaBoard LLC", projectName: "NovaBoard Mobile App", amount: 8400, status: "paid", issuedDate: "2026-06-05", dueDate: "2026-06-20" },
  { id: "INV-2026-003", clientName: "Acme Corp", projectName: "Marketing Website Redesign", amount: 4800, status: "sent", issuedDate: "2026-06-15", dueDate: "2026-06-30" },
  { id: "INV-2026-004", clientName: "Arcadia Solutions", projectName: "NovaBoard Branding Guide", amount: 3500, status: "overdue", issuedDate: "2026-05-10", dueDate: "2026-05-24" },
  { id: "INV-2026-005", clientName: "Globex Corporation", projectName: "Enterprise Integrations R&D", amount: 18900, status: "draft", issuedDate: "2026-06-25", dueDate: "2026-07-10" },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: "EXP-001", merchant: "Amazon Web Services", category: "Software", amount: 1450, status: "approved", date: "2026-06-01" },
  { id: "EXP-002", merchant: "Figma Inc", category: "Software", amount: 240, status: "approved", date: "2026-06-03" },
  { id: "EXP-003", merchant: "Upwork Global", category: "Contractors", amount: 4800, status: "approved", date: "2026-06-10" },
  { id: "EXP-004", merchant: "Google Cloud Workspace", category: "Software", amount: 180, status: "approved", date: "2026-06-12" },
  { id: "EXP-005", merchant: "Delta Air Lines", category: "Travel", amount: 850, status: "pending", date: "2026-06-18" },
  { id: "EXP-006", merchant: "WeWork Labs", category: "Office", amount: 1200, status: "approved", date: "2026-06-01" },
];

const ANALYTICS_DATA = [
  { name: "Jan", Revenue: 32000, Expenses: 14500 },
  { name: "Feb", Revenue: 38000, Expenses: 18200 },
  { name: "Mar", Revenue: 45000, Expenses: 22000 },
  { name: "Apr", Revenue: 42000, Expenses: 19800 },
  { name: "May", Revenue: 56000, Expenses: 26500 },
  { name: "Jun", Revenue: 72150, Expenses: 29800 },
];

const INVOICE_STATUS_META = {
  paid: { label: "Paid", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  sent: { label: "Sent", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  overdue: { label: "Overdue", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border/60" },
};

export default function FinanceView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const storeClients = useStore((s) => s.clients);
  const storeProjects = useStore((s) => s.projects);

  const [tab, setTab] = useState<TabId>("invoices");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Dynamic state arrays
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  // Modal control states
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // New Invoice Form state
  const [newInvoice, setNewInvoice] = useState({
    clientId: "",
    projectId: "",
    itemDesc: "Product Design Services",
    itemQty: 1,
    itemRate: 5000,
    issuedDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  // New Expense Form state
  const [newExpense, setNewExpense] = useState({
    merchant: "",
    category: "Software" as ExpenseCategory,
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  // Calculate invoice list based on client projects selection
  const clientProjects = useMemo(() => {
    if (!newInvoice.clientId) return [];
    return storeProjects.filter((p) => p.clientId === newInvoice.clientId);
  }, [newInvoice.clientId, storeProjects]);

  // Sync client project selection
  useEffect(() => {
    if (clientProjects.length > 0) {
      setNewInvoice((prev) => ({ ...prev, projectId: clientProjects[0].id }));
    } else {
      setNewInvoice((prev) => ({ ...prev, projectId: "" }));
    }
  }, [clientProjects]);

  const invoiceFilterDefs = useMemo(() => [
    {
      id: "status",
      label: "Invoice Status",
      multi: true,
      options: [
        { value: "paid", label: "Paid" },
        { value: "sent", label: "Sent" },
        { value: "overdue", label: "Overdue" },
        { value: "draft", label: "Draft" },
      ],
    },
  ], []);

  const expenseFilterDefs = useMemo(() => [
    {
      id: "category",
      label: "Expense Category",
      multi: true,
      options: [
        { value: "Software", label: "Software overhead" },
        { value: "Contractors", label: "Contractor tasks" },
        { value: "Marketing", label: "Ad campaigns" },
        { value: "Travel", label: "Client visits" },
        { value: "Office", label: "WeWork Space" },
      ],
    },
  ], []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (search && !inv.clientName.toLowerCase().includes(search.toLowerCase()) && !inv.projectName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.status?.length && !filters.status.includes(inv.status)) return false;
      return true;
    });
  }, [invoices, search, filters]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (search && !exp.merchant.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.category?.length && !filters.category.includes(exp.category)) return false;
      return true;
    });
  }, [expenses, search, filters]);

  // Invoice calculations
  const draftInvoiceTotal = useMemo(() => {
    return newInvoice.itemQty * newInvoice.itemRate;
  }, [newInvoice.itemQty, newInvoice.itemRate]);

  const handleCreateInvoice = () => {
    const client = storeClients.find((c) => c.id === newInvoice.clientId);
    const project = storeProjects.find((p) => p.id === newInvoice.projectId);

    if (!client || !project) {
      toast.error("Please select a client and project");
      return;
    }

    const inv: Invoice = {
      id: `INV-2026-0${invoices.length + 1}`,
      clientName: client.name,
      projectName: project.name,
      amount: draftInvoiceTotal,
      status: "draft",
      issuedDate: newInvoice.issuedDate,
      dueDate: newInvoice.dueDate,
    };

    setInvoices((prev) => [inv, ...prev]);
    setIsInvoiceOpen(false);
    toast.success(`Draft invoice ${inv.id} created successfully`);
  };

  const handleLogExpense = () => {
    if (!newExpense.merchant || newExpense.amount <= 0) {
      toast.error("Please enter a merchant name and amount");
      return;
    }

    const exp: Expense = {
      id: `EXP-0${expenses.length + 1}`,
      merchant: newExpense.merchant,
      category: newExpense.category,
      amount: newExpense.amount,
      status: "approved",
      date: newExpense.date,
    };

    setExpenses((prev) => [exp, ...prev]);
    setIsExpenseOpen(false);
    toast.success(`Logged $${exp.amount} overhead expense to ${exp.merchant}`);
  };

  const handleSendReminder = (id: string) => {
    toast.success(`Billing notification reminder emailed for ${id}`);
  };

  if (!mounted) return null;

  return (
    <AppShell
      title="Finance Dashboard"
      subtitle="Invoice clients, log studio overheads, and monitor cashflow margins."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (storeClients.length > 0) {
                setNewInvoice((prev) => ({ ...prev, clientId: storeClients[0].id }));
              }
              setIsInvoiceOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
          <button
            onClick={() => {
              setNewExpense({ merchant: "", category: "Software", amount: 0, date: new Date().toISOString().slice(0, 10) });
              setIsExpenseOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            <CreditCard className="h-4 w-4" /> Log Expense
          </button>
        </div>
      }
    >
      {/* 4 Financial KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 select-none">
        <KpiCard
          label="Total Revenue (YTD)"
          value="$384,500"
          delta="+12% vs last year"
          trend="up"
          icon={Coins}
          colorCls="text-emerald-500 bg-emerald-500/10 border-emerald-500/10"
        />
        <KpiCard
          label="Cash Collected (MTD)"
          value="$72,150"
          delta="94% collection rate"
          trend="up"
          icon={FileCheck}
          colorCls="text-blue-500 bg-blue-500/10 border-blue-500/10"
        />
        <KpiCard
          label="Outstanding Invoices"
          value="$12,450"
          delta="4 pending review"
          trend="down"
          icon={Receipt}
          colorCls="text-amber-500 bg-amber-500/10 border-amber-500/10"
        />
        <KpiCard
          label="Average Deal Size"
          value="$18,200"
          delta="+8% vs last month"
          trend="up"
          icon={TrendingUp}
          colorCls="text-purple-500 bg-purple-500/10 border-purple-500/10"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="mt-6 mb-6 flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSearch("");
                setFilters({});
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Render Content */}
      <div className="transition-all duration-300">
        {/* Invoices sub-tab */}
        {tab === "invoices" && (
          <div className="space-y-4">
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search invoices by client or project..."
              filters={invoiceFilterDefs}
              values={filters}
              onChange={setFilters}
            />

            <div className="panel overflow-hidden bg-card/50 backdrop-blur-sm border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground border-b border-border/50 bg-muted/10">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Invoice ID</th>
                      <th className="px-5 py-3.5 font-semibold">Client Name</th>
                      <th className="px-5 py-3.5 font-semibold">Project Name</th>
                      <th className="px-5 py-3.5 font-semibold">Issued Date</th>
                      <th className="px-5 py-3.5 font-semibold">Due Date</th>
                      <th className="px-5 py-3.5 font-semibold">Amount</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono text-foreground font-bold">{inv.id}</td>
                        <td className="px-5 py-3 text-xs text-foreground font-semibold">{inv.clientName}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground font-medium">{inv.projectName}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{inv.issuedDate}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{inv.dueDate}</td>
                        <td className="px-5 py-3 text-xs font-bold font-mono text-foreground">${inv.amount.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border", INVOICE_STATUS_META[inv.status].cls)}>
                            {INVOICE_STATUS_META[inv.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inv.status === "overdue" && (
                            <button
                              onClick={() => handleSendReminder(inv.id)}
                              className="rounded-full bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 px-3 py-1 text-[10px] font-bold transition-all cursor-pointer border border-rose-500/10"
                            >
                              Send Reminder
                            </button>
                          )}
                          {inv.status === "paid" && (
                            <button
                              onClick={() => toast.success(`Receipt printed for ${inv.id}`)}
                              className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80 p-1.5 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-border/30"
                              title="Print Receipt"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          )}
                          {inv.status === "sent" && (
                            <span className="text-[10px] text-muted-foreground font-semibold">Awaiting Payment</span>
                          )}
                          {inv.status === "draft" && (
                            <button
                              onClick={() => {
                                setInvoices((prev) =>
                                  prev.map((i) => (i.id === inv.id ? { ...i, status: "sent" } : i))
                                );
                                toast.success(`Invoice ${inv.id} issued successfully`);
                              }}
                              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 px-3 py-1 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Issue Invoice
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3 text-muted-foreground/60">
                              <Search className="h-5 w-5" />
                            </div>
                            <div className="font-semibold text-foreground text-xs">No invoices match your active filters</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses sub-tab */}
        {tab === "expenses" && (
          <div className="space-y-4">
            <FilterBar
              search={search}
              onSearch={setSearch}
              placeholder="Search expenses by merchant..."
              filters={expenseFilterDefs}
              values={filters}
              onChange={setFilters}
            />

            <div className="panel overflow-hidden bg-card/50 backdrop-blur-sm border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground border-b border-border/50 bg-muted/10">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Expense ID</th>
                      <th className="px-5 py-3.5 font-semibold">Merchant</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold">Date Logged</th>
                      <th className="px-5 py-3.5 font-semibold">Amount</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono text-foreground font-bold">{exp.id}</td>
                        <td className="px-5 py-3 text-xs text-foreground font-semibold">{exp.merchant}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground font-medium">{exp.category}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{exp.date}</td>
                        <td className="px-5 py-3 text-xs font-bold font-mono text-foreground">${exp.amount.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                            exp.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          )}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {exp.status === "pending" ? (
                            <button
                              onClick={() => {
                                setExpenses((prev) =>
                                  prev.map((e) => (e.id === exp.id ? { ...e, status: "approved" } : e))
                                );
                                toast.success(`Expense ${exp.id} approved`);
                              }}
                              className="rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1 text-[10px] font-bold border border-emerald-500/10 transition-all cursor-pointer"
                            >
                              Approve Expense
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold inline-flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-500" /> Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3 text-muted-foreground/60">
                              <Search className="h-5 w-5" />
                            </div>
                            <div className="font-semibold text-foreground text-xs">No expenses match your active filters</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics area graph */}
        {tab === "analytics" && (
          <div className="panel p-6 bg-card border-border/60">
            <div className="mb-6">
              <h3 className="text-base font-bold text-foreground">Cashflow Margins YTD</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Studio Revenue vs. Overhead Expenses</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={ANALYTICS_DATA} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Revenue Cashflow" dataKey="Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" name="Overhead Expenses" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <AppDialog
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
        title="Create New Invoice"
        description="Draft a professional billing invoice. Details are tracked and issues are logged instantly."
        size="lg"
      >
        <div className="p-6 space-y-4 text-sm">
          <FieldGroup>
            {/* Client selector */}
            <SelectField
              label="Select Client"
              value={newInvoice.clientId}
              onChange={(e) => setNewInvoice({ ...newInvoice, clientId: e.target.value })}
            >
              <option value="">-- Choose client account --</option>
              {storeClients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>

            {/* Project selector */}
            <SelectField
              label="Select Project"
              value={newInvoice.projectId}
              onChange={(e) => setNewInvoice({ ...newInvoice, projectId: e.target.value })}
              disabled={!newInvoice.clientId}
            >
              <option value="">-- Choose client project --</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectField>

            {/* Billing Items list */}
            <div className="border border-border/60 bg-muted/20 p-4 rounded-2xl space-y-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Invoice Billing Items
              </div>
              <TextField
                label="Item Description"
                value={newInvoice.itemDesc}
                onChange={(e) => setNewInvoice({ ...newInvoice, itemDesc: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Quantity"
                  type="number"
                  value={newInvoice.itemQty.toString()}
                  onChange={(e) => setNewInvoice({ ...newInvoice, itemQty: parseInt(e.target.value, 10) || 0 })}
                />
                <TextField
                  label="Rate / Price ($)"
                  type="number"
                  value={newInvoice.itemRate.toString()}
                  onChange={(e) => setNewInvoice({ ...newInvoice, itemRate: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Issued Date"
                type="date"
                value={newInvoice.issuedDate}
                onChange={(e) => setNewInvoice({ ...newInvoice, issuedDate: e.target.value })}
              />
              <TextField
                label="Due Date"
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
              />
            </div>
          </FieldGroup>

          {/* Recalculating grand total visual card */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center justify-between text-foreground">
            <div>
              <div className="text-xs font-bold text-muted-foreground">Estimated Invoice Total</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Includes standard services draft</div>
            </div>
            <div className="text-2xl font-bold font-mono text-primary">${draftInvoiceTotal.toLocaleString()}</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={!newInvoice.clientId || !newInvoice.projectId || draftInvoiceTotal <= 0}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Issue Invoice
            </button>
          </div>
        </div>
      </AppDialog>

      {/* Log Expense Dialog */}
      <AppDialog
        open={isExpenseOpen}
        onOpenChange={setIsExpenseOpen}
        title="Log Overheads Expense"
        description="Record workspace receipts, contractor logs, or SaaS licenses to maintain budget balances."
        size="md"
      >
        <div className="p-6 space-y-4 text-sm">
          <FieldGroup>
            <TextField
              label="Merchant / Supplier Name"
              placeholder="e.g. AWS, Figma, Uber"
              value={newExpense.merchant}
              onChange={(e) => setNewExpense({ ...newExpense, merchant: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
              >
                <option value="Software">Software overhead</option>
                <option value="Contractors">Contractors tasks</option>
                <option value="Marketing">Marketing / Ads</option>
                <option value="Travel">Business travel</option>
                <option value="Office">Office / WeWork</option>
              </SelectField>

              <TextField
                label="Amount Spent ($)"
                type="number"
                value={newExpense.amount === 0 ? "" : newExpense.amount.toString()}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <TextField
              label="Expense Date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </FieldGroup>

          {/* Receipt mockup file uploader */}
          <div className="border border-dashed border-border/80 rounded-2xl p-6 text-center text-xs text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer">
            <Calendar className="h-5 w-5 text-muted-foreground/60 mx-auto mb-2" />
            <div className="font-bold text-foreground">Attach Receipt File</div>
            <div className="text-[10px] mt-0.5">Drag PDF or JPG image receipts here (max 5MB)</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsExpenseOpen(false)}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleLogExpense}
              disabled={!newExpense.merchant || newExpense.amount <= 0}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </div>
      </AppDialog>
    </AppShell>
  );
}

/* ---------- Custom Recharts Tooltip Component ---------- */

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/90 backdrop-blur-md p-3 shadow-lg text-xs leading-none space-y-1.5 select-none text-foreground border-border">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="flex items-center gap-2 font-medium" style={{ color: p.stroke }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.stroke }} />
            <span>{p.name}:</span>
            <span className="font-bold font-mono ml-auto">${p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/* ---------- KPI Grid Component Card ---------- */

function KpiCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  colorCls,
}: {
  label: string;
  value: string | number;
  delta: string;
  trend: "up" | "down";
  icon: React.ComponentType<any>;
  colorCls: string;
}) {
  return (
    <div className="panel p-5 bg-card/60 border-border/60 hover:scale-[1.01] hover:bg-card/85 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute right-0 top-0 -mt-6 -mr-6 h-16 w-16 rounded-full blur-lg opacity-10 pointer-events-none group-hover:scale-125 transition-transform"
        style={{
          backgroundColor: trend === "up" ? "#10B981" : "#EF4444",
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">{label}</span>
          <span className="mt-1 text-2xl font-bold text-foreground leading-none block">{value}</span>
        </div>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl border shrink-0", colorCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
        <span className="truncate">{delta}</span>
        {trend === "up" ? (
          <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/10 rounded px-1 text-[9px]">Active</span>
        ) : (
          <span className="text-amber-500 bg-amber-500/10 border border-amber-500/10 rounded px-1 text-[9px]">Watch</span>
        )}
      </div>
    </div>
  );
}
