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
  delay?: number; // Entry animation stagger delay in ms
}

const colorMap = {
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/10",
    border: "hover:border-purple-500/25",
    progress: "bg-purple-500",
    sparkline: "stroke-purple-500",
    gradStart: "rgba(168, 85, 247, 0.22)",
    gradStop: "rgba(168, 85, 247, 0)",
    accentGlow: "from-purple-500/5 via-purple-500/[0.02] to-transparent",
    iconTheme: "bg-purple-500/10 border-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10",
    border: "hover:border-blue-500/25",
    progress: "bg-blue-500",
    sparkline: "stroke-blue-500",
    gradStart: "rgba(59, 130, 246, 0.22)",
    gradStop: "rgba(59, 130, 246, 0)",
    accentGlow: "from-blue-500/5 via-blue-500/[0.02] to-transparent",
    iconTheme: "bg-blue-500/10 border-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500",
  },
  green: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10",
    border: "hover:border-emerald-500/25",
    progress: "bg-emerald-500",
    sparkline: "stroke-emerald-500",
    gradStart: "rgba(16, 185, 129, 0.22)",
    gradStop: "rgba(16, 185, 129, 0)",
    accentGlow: "from-emerald-500/5 via-emerald-500/[0.02] to-transparent",
    iconTheme: "bg-emerald-500/10 border-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500",
  },
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/10",
    border: "hover:border-orange-500/25",
    progress: "bg-orange-500",
    sparkline: "stroke-orange-500",
    gradStart: "rgba(249, 115, 22, 0.22)",
    gradStop: "rgba(249, 115, 22, 0)",
    accentGlow: "from-orange-500/5 via-orange-500/[0.02] to-transparent",
    iconTheme: "bg-orange-500/10 border-orange-500/10 text-orange-600 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500",
  },
  pink: {
    text: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/10",
    border: "hover:border-pink-500/25",
    progress: "bg-pink-500",
    sparkline: "stroke-pink-500",
    gradStart: "rgba(236, 72, 153, 0.22)",
    gradStop: "rgba(236, 72, 153, 0)",
    accentGlow: "from-pink-500/5 via-pink-500/[0.02] to-transparent",
    iconTheme: "bg-pink-500/10 border-pink-500/10 text-pink-600 group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10",
    border: "hover:border-amber-500/25",
    progress: "bg-amber-500",
    sparkline: "stroke-amber-500",
    gradStart: "rgba(245, 158, 11, 0.22)",
    gradStop: "rgba(245, 158, 11, 0)",
    accentGlow: "from-amber-500/5 via-amber-500/[0.02] to-transparent",
    iconTheme: "bg-amber-500/10 border-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500",
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
  delay = 0,
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
        "group relative flex flex-col rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        config.border,
        className
      )}
      style={{
        animation: "kpi-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        animationDelay: `${delay}ms`,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes kpi-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes kpi-draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes kpi-fade-in-fill {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />

      {/* Premium Ambient Hover Glow */}
      <div className={cn(
        "absolute inset-0 -z-10 rounded-3xl opacity-0 bg-gradient-to-br transition-opacity duration-500 group-hover:opacity-100 blur-xl pointer-events-none",
        config.accentGlow
      )} />

      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm", config.iconTheme)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Main Metric Section */}
      <div className="mt-3 space-y-1">
        <div className="text-3xl font-extrabold tracking-tight text-foreground leading-none">{value}</div>
        
        {/* Supporting Label / Trend */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
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
        <div className="mt-auto pt-5 border-t border-border/20 flex items-center justify-between min-h-[36px]">
          {/* Progress bar visual */}
          {progress !== undefined && (
            <div className="w-full space-y-1.5 h-[36px] flex flex-col justify-center">
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
                <path 
                  d={sparklinePath.closedPathStr} 
                  fill={`url(#${uniqueGradId})`} 
                  stroke="none" 
                  style={{
                    animation: "kpi-fade-in-fill 0.8s ease-out 0.6s both",
                  }}
                />
                <path 
                  d={sparklinePath.pathStr} 
                  fill="none" 
                  className={config.sparkline} 
                  strokeWidth="1.75" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 200,
                    animation: "kpi-draw-line 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
                  }}
                />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
