import { Database } from "@/integrations/supabase/types";
import { EquipmentType } from "@/lib/lift-plan";

export type ServiceKind = "review" | "write";

export interface ServicePricingRow {
  id: string;
  service: ServiceKind;
  equipment_type: EquipmentType;
  price: number;
  updated_at: string;
}

export const MIN_LEAD_HOURS: Record<ServiceKind, number> = {
  review: 48,
  write: 72,
};

export const MIN_LEAD_LABEL: Record<ServiceKind, string> = {
  review: "48 hours",
  write: "72 hours",
};

export function hoursUntil(date: Date): number {
  return (date.getTime() - Date.now()) / 36e5;
}

export type _DB = Database;
