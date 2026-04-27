import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";

const map: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-[oklch(0.95_0.04_240)] text-[oklch(0.4_0.18_240)] border-[oklch(0.85_0.08_240)]",
  COMPLETED: "bg-[oklch(0.94_0.05_145)] text-[oklch(0.4_0.16_145)] border-[oklch(0.85_0.1_145)]",
  CANCELLED: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.2_25)] border-[oklch(0.85_0.12_25)]",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", map[status], className)}>
      {status}
    </Badge>
  );
}