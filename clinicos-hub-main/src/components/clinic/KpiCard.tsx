import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  spark?: number[];
  storageKey?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  spark,
  storageKey,
}: KpiCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "text-[var(--clinic-blue)] bg-[var(--clinic-blue-soft)]"
      : trend?.direction === "down"
        ? "text-[var(--clinic-red)] bg-[var(--clinic-red-soft)]"
        : "text-muted-foreground bg-muted";
  const TrendIcon =
    trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            <AnimatedCounter value={value} storageKey={storageKey} />
          </p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: iconBg ?? "var(--clinic-blue-soft)",
            color: iconColor ?? "var(--clinic-blue)",
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              trendColor,
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      )}
      {sparkData.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clinic-blue)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--clinic-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--clinic-blue)"
                strokeWidth={1.5}
                fill={`url(#spark-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
