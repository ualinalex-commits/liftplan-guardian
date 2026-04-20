import { LiftPlanStatus, STATUS_LABEL, STATUS_VARIANT } from "@/lib/lift-plan";
import {
  LiftPlanWriteStatus,
  WRITE_STATUS_LABEL,
  WRITE_STATUS_VARIANT,
} from "@/lib/lift-plan-write";
import { cn } from "@/lib/utils";

type Props =
  | { status: LiftPlanStatus; kind?: "review"; className?: string }
  | { status: LiftPlanWriteStatus; kind: "write"; className?: string };

export function StatusBadge({ status, kind = "review", className }: Props) {
  const label =
    kind === "write"
      ? WRITE_STATUS_LABEL[status as LiftPlanWriteStatus]
      : STATUS_LABEL[status as LiftPlanStatus];
  const variant =
    kind === "write"
      ? WRITE_STATUS_VARIANT[status as LiftPlanWriteStatus]
      : STATUS_VARIANT[status as LiftPlanStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variant,
        className,
      )}
    >
      {label}
    </span>
  );
}
