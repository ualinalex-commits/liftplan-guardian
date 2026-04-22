import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EQUIPMENT_OPTIONS, EquipmentType, PaymentType } from "@/lib/lift-plan";
import { MIN_LEAD_HOURS, MIN_LEAD_LABEL, hoursUntil, ServicePricingRow } from "@/lib/pricing";
import { getPaymentLink } from "@/lib/payment-links";
import { toast } from "sonner";
import { Loader2, Upload, X, ArrowLeft, CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const NewLiftPlan = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState<EquipmentType | "">("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [paymentType, setPaymentType] = useState<PaymentType>("direct");
  const [poNumber, setPoNumber] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pricing, setPricing] = useState<ServicePricingRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_pricing" as never)
        .select("*")
        .eq("service", "review");
      setPricing((data as ServicePricingRow[]) ?? []);
    })();
  }, []);

  const price = equipment ? pricing.find((p) => p.equipment_type === equipment)?.price ?? 0 : 0;
  const leadHours = dueDate ? hoursUntil(dueDate) : null;
  const tooSoon = leadHours !== null && leadHours < MIN_LEAD_HOURS.review;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !equipment || !dueDate) return;
    if (tooSoon) {
      toast.error(`Reviews need at least ${MIN_LEAD_LABEL.review} notice`);
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload at least one lift plan file");
      return;
    }
    if (paymentType === "po" && !poNumber.trim()) {
      toast.error("Please enter a PO number");
      return;
    }
    setSubmitting(true);
    try {
      const { data: plan, error: planErr } = await supabase
        .from("lift_plans")
        .insert({
          client_id: user.id,
          reference: reference.trim(),
          description: description.trim() || null,
          equipment_type: equipment,
          timeframe: "48h",
          due_date: dueDate.toISOString(),
          payment_type: paymentType,
          payment_status: paymentType === "po" ? "po_recorded" : "pending",
          po_number: paymentType === "po" ? poNumber.trim() : null,
          price: price || null,
          status: "submitted",
        } as never)
        .select()
        .single();
      if (planErr) throw planErr;

      for (const file of files) {
        const path = `${user.id}/${plan.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("lift-plan-files")
          .upload(path, file);
        if (upErr) throw upErr;
        const { error: fileErr } = await supabase.from("lift_plan_files").insert({
          lift_plan_id: plan.id,
          uploaded_by: user.id,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_review_document: false,
        });
        if (fileErr) throw fileErr;
      }

      toast.success("Lift plan submitted for review");
      navigate(`/dashboard/${plan.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Submit lift plan</h1>
        <p className="text-muted-foreground mb-6">An Appointed Person will review your submission.</p>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Submitter</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{profile?.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium truncate">{profile?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Company</Label>
                <p className="font-medium">{profile?.company || "—"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="ref">Lift plan name / reference *</Label>
              <Input id="ref" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Site A — Tower Crane Erection" />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the lift" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Equipment type *</Label>
                <Select value={equipment} onValueChange={(v) => setEquipment(v as EquipmentType)}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipment && price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Price: £{price.toFixed(2)}</p>
                )}
              </div>
              <div>
                <Label>Due date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(d) => d < new Date(Date.now() - 86400000)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {tooSoon && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    Reviews need at least {MIN_LEAD_LABEL.review} notice. Please choose a later date.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Payment type *</Label>
              <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)} className="grid sm:grid-cols-2 gap-3 mt-2">
                <Label htmlFor="pt-direct" className="flex items-center gap-3 border rounded-md p-3 cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-secondary">
                  <RadioGroupItem id="pt-direct" value="direct" />
                  <div>
                    <p className="font-semibold">Direct payment</p>
                    <p className="text-xs text-muted-foreground">Pay online by card</p>
                  </div>
                </Label>
                <Label htmlFor="pt-po" className="flex items-center gap-3 border rounded-md p-3 cursor-pointer hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-secondary">
                  <RadioGroupItem id="pt-po" value="po" />
                  <div>
                    <p className="font-semibold">Purchase Order</p>
                    <p className="text-xs text-muted-foreground">Provide a PO number</p>
                  </div>
                </Label>
              </RadioGroup>
              {paymentType === "po" && (
                <div className="mt-3">
                  <Label htmlFor="po">PO number *</Label>
                  <Input id="po" required value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <Label>Lift plan files *</Label>
            <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Click to upload or drag files</p>
              <p className="text-xs text-muted-foreground">PDFs, images, documents</p>
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-secondary rounded px-3 py-2">
                    <span className="truncate">{f.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)}>
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button type="submit" disabled={submitting || tooSoon} size="lg">
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit for review
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default NewLiftPlan;
