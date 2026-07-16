import { Search, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";

/**
 * Unified Filter Bar — used across Projects, Requests,
 * Documents, Messages, Time, Team and Reporting.
 */

export type FilterOption = { value: string; label: string; color?: string };

export type FilterDef = {
  id: string;
  label: string;
  options: FilterOption[];
  multi?: boolean;
};

export type FilterValues = Record<string, string[]>;

export interface FilterBarProps {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  values?: FilterValues;
  onChange?: (next: FilterValues) => void;
  /** Optional date range — emits ISO strings. */
  dateRange?: { from?: string; to?: string };
  onDateRange?: (v: { from?: string; to?: string }) => void;
  trailing?: React.ReactNode;
}

export function FilterBar({
  search,
  onSearch,
  placeholder = "Search…",
  filters = [],
  values = {},
  onChange,
  dateRange,
  onDateRange,
  trailing,
}: FilterBarProps) {
  const activeCount = Object.values(values).reduce((a, v) => a + (v?.length ?? 0), 0) + (dateRange?.from || dateRange?.to ? 1 : 0);

  function toggle(filterId: string, value: string, multi?: boolean) {
    const current = values[filterId] ?? [];
    let next: string[];
    if (multi) {
      next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    } else {
      next = current.includes(value) ? [] : [value];
    }
    onChange?.({ ...values, [filterId]: next });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {onSearch !== undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-72 rounded-full border border-border bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
      )}

      {filters.map((f) => (
        <FilterDropdown
          key={f.id}
          def={f}
          selected={values[f.id] ?? []}
          onToggle={(v) => toggle(f.id, v, f.multi)}
          onClear={() => onChange?.({ ...values, [f.id]: [] })}
        />
      ))}

      {onDateRange && (
        <DateRangeDropdown value={dateRange ?? {}} onChange={onDateRange} />
      )}

      {activeCount > 0 && (
        <button
          onClick={() => {
            onChange?.(Object.fromEntries(filters.map((f) => [f.id, []])));
            onDateRange?.({});
          }}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" /> Reset ({activeCount})
        </button>
      )}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

function FilterDropdown({
  def,
  selected,
  onToggle,
  onClear,
}: {
  def: FilterDef;
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const summary =
    selected.length === 0
      ? def.label
      : selected.length === 1
        ? def.options.find((o) => o.value === selected[0])?.label ?? def.label
        : `${def.label} · ${selected.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-colors",
          selected.length > 0
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {summary}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl p-1.5">
          <div className="max-h-64 overflow-y-auto">
            {def.options.map((o) => {
              const active = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  onClick={() => onToggle(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors",
                    active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {o.color && <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />}
                    {o.label}
                  </span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <button
              onClick={onClear}
              className="mt-1 w-full rounded-xl px-2.5 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-muted"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DateRangeDropdown({
  value,
  onChange,
}: {
  value: { from?: string; to?: string };
  onChange: (v: { from?: string; to?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const formatShort = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const label =
    value.from && value.to
      ? `${formatShort(value.from)} → ${formatShort(value.to)}`
      : value.from
        ? `From ${formatShort(value.from)}`
        : value.to
          ? `Until ${formatShort(value.to)}`
          : "Date range";

  function preset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    onChange({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-colors",
          value.from || value.to
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              From
              <DateInput
                value={value.from ?? ""}
                onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
                className="mt-1"
                inputClassName="h-9 rounded-xl px-2 text-xs font-normal normal-case tracking-normal"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              To
              <DateInput
                value={value.to ?? ""}
                onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
                className="mt-1"
                inputClassName="h-9 rounded-xl px-2 text-xs font-normal normal-case tracking-normal"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { label: "7d", v: 7 },
              { label: "30d", v: 30 },
              { label: "90d", v: 90 },
              { label: "YTD", v: 365 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => preset(p.v)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-muted"
              >
                Last {p.label}
              </button>
            ))}
            <button
              onClick={() => {
                onChange({});
                setOpen(false);
              }}
              className="ml-auto rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────── Date range helpers ────────── */

export function inRange(date: string | Date, range: { from?: string; to?: string }): boolean {
  if (!range.from && !range.to) return true;

  const parseDate = (dVal: string | Date) => {
    if (dVal instanceof Date) return dVal;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dVal)) {
      const [y, m, d] = dVal.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const dObj = new Date(dVal);
    dObj.setHours(0, 0, 0, 0);
    return dObj;
  };

  const targetDate = parseDate(date);
  if (isNaN(targetDate.getTime())) return true;

  if (range.from) {
    const fromDate = parseDate(range.from);
    if (targetDate.getTime() < fromDate.getTime()) return false;
  }
  if (range.to) {
    const toDate = parseDate(range.to);
    if (targetDate.getTime() > toDate.getTime()) return false;
  }
  return true;
}
