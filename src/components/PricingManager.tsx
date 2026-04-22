import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EQUIPMENT_OPTIONS, EquipmentType } from "@/lib/lift-plan";
import { ServiceKind, ServicePricingRow } from "@/lib/pricing";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const SERVICES: { value: ServiceKind; label: string }[] = [
  { value: "review", label: "Lift plan review" },
  { value: "write", label: "Lift plan writing" },
];

export const PricingManager = () => {
  const [rows, setRows] = useState<ServicePricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("service_pricing" as never).select("*");
    const list = (data as ServicePricingRow[]) ?? [];
    setRows(list);
    const d: Record<string, string> = {};
    list.forEach((r) => (d[`${r.service}:${r.equipment_type}`] = String(r.price ?? 0)));
    setDrafts(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const upsert = async (service: ServiceKind, eq: EquipmentType) => {
    const key = `${service}:${eq}`;
    const value = parseFloat(drafts[key] ?? "0");
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid price");
      return;
    }
    setSavingKey(key);
    const existing = rows.find((r) => r.service === service && r.equipment_type === eq);
    const payload = { service, equipment_type: eq, price: value } as never;
    const tbl = supabase.from("service_pricing" as never);
    const { error } = existing
      ? await (tbl as any).update(payload).eq("id", existing.id)
      : await (tbl as any).insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Price saved");
      await load();
    }
    setSavingKey(null);
  };

  if (loading) {
    return (
      <Card className="p-6 grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Service pricing</h2>
        <p className="text-sm text-muted-foreground">
          Set the price clients see when submitting, per equipment type.
        </p>
      </div>

      {SERVICES.map((svc) => (
        <div key={svc.value} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {svc.label}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const key = `${svc.value}:${eq.value}`;
              return (
                <div key={key} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">{eq.label}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        £
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-7"
                        value={drafts[key] ?? "0"}
                        onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upsert(svc.value, eq.value)}
                    disabled={savingKey === key}
                  >
                    {savingKey === key ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Card>
  );
};
