import { EquipmentType } from "@/lib/lift-plan";
import { ServiceKind } from "@/lib/pricing";

// Stripe Payment Links per service + equipment type.
// Returning null means there is no payment link configured for that combination
// (e.g. equipment that isn't currently offered for writing).
const REVIEW_CRANE_LINK = "https://buy.stripe.com/7sY6oH3cR3XwamQ8gmasg00";
const REVIEW_OTHER_LINK = "https://buy.stripe.com/14A4gz00F2Ts0Mg8gmasg01";
const WRITE_TELEHANDLER_MEWP_LINK = "https://buy.stripe.com/6oUaEX9Bf65EgLeaouasg02";

export function getPaymentLink(
  service: ServiceKind,
  equipment: EquipmentType,
): string | null {
  if (service === "review") {
    if (equipment === "tower_crane" || equipment === "mobile_crane") {
      return REVIEW_CRANE_LINK;
    }
    // excavator (digger), telehandler (forklift), hiab, mewp
    return REVIEW_OTHER_LINK;
  }

  if (service === "write") {
    if (equipment === "forklift" || equipment === "mewp") {
      return WRITE_TELEHANDLER_MEWP_LINK;
    }
    return null;
  }

  return null;
}
