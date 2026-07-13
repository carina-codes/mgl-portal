import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { DateInput } from "./date-input";

/**
 * AppDialog — the unified modal primitive for the Carina Client Platform.
 *
 * - Consistent spacing, typography, radius, and footer alignment
 * - Optional multi-step flow (steps with Back / Next)
 * - Composable: pass children for single-step, or `steps` for a wizard
 * - Sizes: sm | md | lg | xl | full
 */

export type AppDialogSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE_CLS: Record<AppDialogSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[min(96vw,1200px)]",
};

export interface AppDialogStep {
  id: string;
  title: string;
  description?: string;
  /** Render fn receives helpers. Return null to allow advance, or string to block w/ message. */
  content: (helpers: { goNext: () => void; goBack: () => void; close: () => void }) => React.ReactNode;
  /** If false, disables the Next button on this step. */
  canAdvance?: boolean;
  /** Custom label for the primary button on this step. */
  primaryLabel?: string;
}

interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  size?: AppDialogSize;
  className?: string;
}

interface SingleProps extends BaseProps {
  title: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  steps?: never;
}

interface WizardProps extends BaseProps {
  title?: string;
  icon?: React.ReactNode;
  steps: AppDialogStep[];
  onComplete?: () => void;
  completeLabel?: string;
  children?: never;
  footer?: never;
  description?: never;
}

export type AppDialogProps = SingleProps | WizardProps;

export function AppDialog(props: AppDialogProps) {
  const size = props.size ?? "md";

  if ("steps" in props && props.steps) {
    return <WizardDialog {...props} sizeCls={SIZE_CLS[size]} />;
  }

  const { open, onOpenChange, title, description, icon, children, footer, className } = props as SingleProps;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn( "gap-0 overflow-hidden rounded-3xl border-border/60 bg-card p-0 ", SIZE_CLS[size], className, )}
      >
        <DialogHeader className="space-y-1.5 border-b border-border/60 bg-gradient-to-b from-background to-card px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm text-muted-foreground">{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="px-6 py-5">{children}</div>
        </div>
        {footer && (
          <DialogFooter className="border-t border-border/60 bg-muted/30 px-6 py-4 sm:justify-end">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WizardDialog({
  open,
  onOpenChange,
  title,
  icon,
  steps,
  onComplete,
  completeLabel = "Finish",
  sizeCls,
}: WizardProps & { sizeCls: string }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  const step = steps[idx];
  const isLast = idx === steps.length - 1;
  const goNext = () => {
    if (isLast) {
      onComplete?.();
      onOpenChange(false);
    } else {
      setIdx((i) => Math.min(steps.length - 1, i + 1));
    }
  };
  const goBack = () => setIdx((i) => Math.max(0, i - 1));
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn( "gap-0 overflow-hidden rounded-3xl border-border/60 bg-card p-0 ", sizeCls, )}
      >
        <DialogHeader className="space-y-3 border-b border-border/60 bg-gradient-to-b from-background to-card px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">{title ?? step.title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {step.description ?? `Step ${idx + 1} of ${steps.length}`}
              </DialogDescription>
            </div>
            <div className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {idx + 1} / {steps.length}
            </div>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={cn( "h-1 flex-1 rounded-full transition-colors", i <= idx ? "bg-primary" : "bg-muted", )}
              />
            ))}
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="px-6 py-5">{step.content({ goNext, goBack, close })}</div>
        </div>
        <DialogFooter className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={idx === 0}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={step.canAdvance === false}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step.primaryLabel ?? (isLast ? completeLabel : "Continue")}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───── Shared form primitives used inside AppDialog ───── */

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>
      {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
    </div>
  );
}

export function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function TextField({
  label,
  hint,
  className,
  type,
  ...rest
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      {type === "date" ? (
        <DateInput
          {...rest}
          className={className}
        />
      ) : (
        <input
          {...rest}
          type={type}
          className={cn( "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15", className, )}
        />
      )}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  className,
  children,
  ...rest
}: { label: string; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <select
        {...rest}
        className={cn( "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15", className, )}
      >
        {children}
      </select>
    </div>
  );
}
