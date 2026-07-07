import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  accent?: boolean;
}

export function StatCard({ title, value, icon, description, trend, className, accent }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-2xl p-4 border card-lift",
      accent
        ? "bg-primary text-primary-foreground border-primary/20"
        : "bg-card border-card-border",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            accent ? "bg-white/20" : "bg-primary/10"
          )}>
            <span className={accent ? "text-white" : "text-primary"}>{icon}</span>
          </div>
        )}
        {trend && (
          <span className={cn(
            "text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
            accent
              ? "bg-white/20 text-white"
              : trend.isPositive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
          )}>
            {trend.isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className={cn(
        "text-[11px] font-semibold uppercase tracking-wide mb-0.5",
        accent ? "text-white/70" : "text-muted-foreground/70"
      )}>{title}</p>
      <p className={cn(
        "text-xl font-bold stat-value leading-tight",
        accent ? "text-white" : "text-foreground"
      )}>{value}</p>
      {description && (
        <p className={cn("text-[11px] mt-0.5", accent ? "text-white/60" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
  );
}
