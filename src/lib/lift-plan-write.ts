import { Database } from "@/integrations/supabase/types";
import { EquipmentType } from "@/lib/lift-plan";

export type LiftPlanWrite = Database["public"]["Tables"]["lift_plan_writes"]["Row"];
export type LiftPlanWriteStatus = Database["public"]["Enums"]["lift_plan_write_status"];

export const WRITE_STATUS_LABEL: Record<LiftPlanWriteStatus, string> = {
  submitted: "Submitted",
  assigned: "Assigned",
  request_info: "Request Info",
  draft_delivered: "Draft Delivered",
  completed: "Completed",
};

export const WRITE_STATUS_VARIANT: Record<LiftPlanWriteStatus, string> = {
  submitted: "bg-info text-info-foreground",
  assigned: "bg-primary text-primary-foreground",
  request_info: "bg-accent text-accent-foreground",
  draft_delivered: "bg-warning text-warning-foreground",
  completed: "bg-success text-success-foreground",
};

// Equipment availability for the WRITING service.
// Currently available: Telehandler (forklift) and MEWP. Others coming soon.
export const WRITE_EQUIPMENT_AVAILABLE: Record<EquipmentType, boolean> = {
  forklift: true,
  mewp: true,
  tower_crane: false,
  mobile_crane: false,
  digger: false,
  hiab: false,
};
