import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LiftPlan, EQUIPMENT_LABEL, STATUS_LABEL, LiftPlanStatus } from "@/lib/lift-plan";
import { Loader2, BarChart3, CheckCircle2, ClipboardList, DollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RoleRow {
  id: string;
  user_id: string;
  role: "client" | "appointed_person" | "admin";
}
interface ProfileLite {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
}

const Management = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<LiftPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // admin role mgmt
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [emailToPromote, setEmailToPromote] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: planData } = await supabase.from("lift_plans").select("*");
      setPlans((planData as LiftPlan[]) ?? []);
      if (isAdmin) {
        const [{ data: profileData }, { data: roleData }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, company"),
          supabase.from("user_roles").select("*"),
        ]);
        setProfiles((profileData as ProfileLite[]) ?? []);
        setRoles((roleData as RoleRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  const completed = plans.filter((p) => p.status === "completed").length;
  const inProgress = plans.filter((p) => !["completed", "rejected"].includes(p.status)).length;
  const totalRevenue = plans
    .filter((p) => p.payment_status === "paid")
    .reduce((sum, p) => sum + Number(p.price ?? 0), 0);

  const byStatus = (Object.keys(STATUS_LABEL) as LiftPlanStatus[]).map((s) => ({
    status: s,
    count: plans.filter((p) => p.status === s).length,
  }));

  const byEquipment = Object.entries(EQUIPMENT_LABEL).map(([k, label]) => ({
    label,
    count: plans.filter((p) => p.equipment_type === k).length,
  }));

  const promote = async () => {
    if (!emailToPromote.trim()) return;
    const target = profiles.find((p) => p.email.toLowerCase() === emailToPromote.toLowerCase().trim());
    if (!target) {
      toast.error("No user with that email");
      return;
    }
    setActing(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: target.id, role: "appointed_person" });
    if (error) toast.error(error.message);
    else {
      toast.success(`${target.full_name} is now an Appointed Person`);
      const { data } = await supabase.from("user_roles").select("*");
      setRoles((data as RoleRow[]) ?? []);
      setEmailToPromote("");
    }
    setActing(false);
  };

  const removeRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast.error(error.message);
    else {
      setRoles((r) => r.filter((x) => x.id !== roleId));
      toast.success("Role removed");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container py-16 grid place-items-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const reviewers = roles
    .filter((r) => r.role === "appointed_person" || r.role === "admin")
    .map((r) => ({ ...r, profile: profiles.find((p) => p.id === r.user_id) }));

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Management</h1>
          <p className="text-muted-foreground">Stats, pricing and team</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total reviews</p>
              <BarChart3 className="size-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{plans.length}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <CheckCircle2 className="size-5 text-success" />
            </div>
            <p className="text-3xl font-bold">{completed}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">In progress</p>
              <ClipboardList className="size-5 text-warning" />
            </div>
            <p className="text-3xl font-bold">{inProgress}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Revenue (paid)</p>
              <DollarSign className="size-5 text-success" />
            </div>
            <p className="text-3xl font-bold">£{totalRevenue.toFixed(2)}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">By status</h2>
            <div className="space-y-3">
              {byStatus.map((b) => {
                const max = Math.max(...byStatus.map((x) => x.count), 1);
                return (
                  <div key={b.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{STATUS_LABEL[b.status]}</span>
                      <span className="font-semibold">{b.count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(b.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">By equipment</h2>
            <div className="space-y-3">
              {byEquipment.map((b) => {
                const max = Math.max(...byEquipment.map((x) => x.count), 1);
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b.label}</span>
                      <span className="font-semibold">{b.count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${(b.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {isAdmin && (
          <Card className="p-6">
            <h2 className="font-semibold mb-1">Appointed Persons</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manually grant the Appointed Person role by user email.
            </p>
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="email-prom" className="sr-only">Email</Label>
                <Input
                  id="email-prom"
                  type="email"
                  placeholder="user@example.com"
                  value={emailToPromote}
                  onChange={(e) => setEmailToPromote(e.target.value)}
                />
              </div>
              <Button onClick={promote} disabled={acting}>
                <Plus className="mr-2 size-4" /> Grant role
              </Button>
            </div>
            <ul className="divide-y border rounded-md">
              {reviewers.length === 0 && <li className="p-4 text-sm text-muted-foreground">No reviewers yet</li>}
              {reviewers.map((r) => (
                <li key={r.id} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.profile?.full_name ?? "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{r.profile?.email} · {r.role}</p>
                  </div>
                  {r.role !== "admin" && (
                    <Button variant="ghost" size="sm" onClick={() => removeRole(r.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Management;
