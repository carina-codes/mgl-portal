"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
    label?: string;
  };
  description?: string;
  color?: "purple" | "blue" | "green" | "orange" | "pink" | "amber";
  progress?: number; // percentage 0-100
  sparklineData?: number[]; // list of numbers for sparkline graph
  className?: string;
}

const colorMap = {
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    border: "hover:border-purple-500/25",
    progress: "bg-purple-500",
    sparkline: "stroke-purple-500",
    gradStart: "rgba(168, 85, 247, 0.2)",
    gradStop: "rgba(168, 85, 247, 0)",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-500/25",
    progress: "bg-blue-500",
    sparkline: "stroke-blue-500",
    gradStart: "rgba(59, 130, 246, 0.2)",
    gradStop: "rgba(59, 130, 246, 0)",
  },
  green: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "hover:border-emerald-500/25",
    progress: "bg-emerald-500",
    sparkline: "stroke-emerald-500",
    gradStart: "rgba(16, 185, 129, 0.2)",
    gradStop: "rgba(16, 185, 129, 0)",
  },
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    border: "hover:border-orange-500/25",
    progress: "bg-orange-500",
    sparkline: "stroke-orange-500",
    gradStart: "rgba(249, 115, 22, 0.2)",
    gradStop: "rgba(249, 115, 22, 0)",
  },
  pink: {
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    border: "hover:border-pink-500/25",
    progress: "bg-pink-500",
    sparkline: "stroke-pink-500",
    gradStart: "rgba(236, 72, 153, 0.2)",
    gradStop: "rgba(236, 72, 153, 0)",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-500/25",
    progress: "bg-amber-500",
    sparkline: "stroke-amber-500",
    gradStart: "rgba(245, 158, 11, 0.2)",
    gradStop: "rgba(245, 158, 11, 0)",
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
  progress,
  sparklineData,
  className,
}) => {
  const config = colorMap[color];

  // Generate SVG path for sparkline
  const sparklinePath = useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const width = 120;
    const height = 36;
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return { x, y };
    });

    // Generate straight segments
    const pathStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    
    // Generate closed path for background gradient
    const closedPathStr = `${pathStr} L ${width} 36 L 0 36 Z`;

    return { pathStr, closedPathStr };
  }, [sparklineData]);

  const id = React.useId();
  const uniqueGradId = `sparkline-grad-${color}-${id.replace(/:/g, "")}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-card/90 hover:shadow-md",
        config.border,
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105", config.bg)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Main Metric Section */}
      <div className="mt-3.5 space-y-1">
        <div className="text-3xl font-extrabold tracking-tight text-foreground leading-none">{value}</div>
        
        {/* Supporting Label / Trend */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                trend.positive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/15 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/15 dark:text-rose-400"
              )}
            >
              {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Visualization (If present) */}
      {(progress !== undefined || sparklinePath) && (
        <div className="mt-5 pt-3.5 border-t border-border/20 flex items-center justify-between min-h-[36px]">
          {/* Progress bar visual */}
          {progress !== undefined && (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Completion</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/65 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", config.progress)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Sparkline visual */}
          {sparklinePath && progress === undefined && (
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">7d trend</span>
              <svg width="120" height="36" className="overflow-visible">
                <defs>
                  <linearGradient id={uniqueGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={config.gradStart} />
                    <stop offset="100%" stopColor={config.gradStop} />
                  </linearGradient>
                </defs>
                <path d={sparklinePath.closedPathStr} fill={`url(#${uniqueGradId})`} stroke="none" />
                <path d={sparklinePath.pathStr} fill="none" className={config.sparkline} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
