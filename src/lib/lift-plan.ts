import { Database } from "@/integrations/supabase/types";

export type LiftPlan = Database["public"]["Tables"]["lift_plans"]["Row"];
export type LiftPlanStatus = Database["public"]["Enums"]["lift_plan_status"];
export type EquipmentType = Database["public"]["Enums"]["equipment_type"];
export type Timeframe = Database["public"]["Enums"]["timeframe_type"];
export type PaymentType = Database["public"]["Enums"]["payment_type"];

export const STATUS_LABEL: Record<LiftPlanStatus, string> = {
  submitted: "Submitted",
  assigned: "Assigned",
  in_review: "In Review",
  request_info: "Request Info",
  rejected: "Rejected",
  completed: "Completed",
};

export const STATUS_VARIANT: Record<LiftPlanStatus, string> = {
  submitted: "bg-info text-info-foreground",
  assigned: "bg-primary text-primary-foreground",
  in_review: "bg-warning text-warning-foreground",
  request_info: "bg-accent text-accent-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  completed: "bg-success text-success-foreground",
};

export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  tower_crane: "Tower Crane",
  mobile_crane: "Mobile Crane",
  digger: "Digger",
  forklift: "Forklift",
  hiab: "Hiab",
  mewp: "MEWP",
};

export const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "24h": "24 hours",
  "48h": "48 hours",
  "72h": "72 hours",
};

export const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: "tower_crane", label: "Tower Crane" },
  { value: "mobile_crane", label: "Mobile Crane" },
  { value: "digger", label: "Digger" },
  { value: "forklift", label: "Forklift" },
  { value: "hiab", label: "Hiab" },
  { value: "mewp", label: "MEWP" },
];

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "48h", label: "48 hours" },
  { value: "72h", label: "72 hours" },
];
