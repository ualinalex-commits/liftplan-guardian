import { LiftPlanStatus, STATUS_LABEL, STATUS_VARIANT } from "@/lib/lift-plan";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: LiftPlanStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        STATUS_VARIANT[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
