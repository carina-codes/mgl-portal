import * as React from "react";
import { cn } from "@/lib/utils";

const formatDate = (dateStr: any) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return String(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md";
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, className, inputClassName, size = "md", ...rest }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        <input
          type="text"
          readOnly
          value={formatDate(value)}
          className={cn(
            "w-full border border-border bg-background text-foreground outline-none transition-all",
            size === "sm" 
              ? "h-8 rounded-xl px-2.5 py-1.5 text-xs" 
              : "h-11 rounded-2xl px-4 text-sm font-medium",
            inputClassName
          )}
        />
        <input
          {...rest}
          ref={ref}
          type="date"
          value={value ?? ""}
          onChange={onChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
