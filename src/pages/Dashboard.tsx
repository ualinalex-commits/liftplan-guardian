import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LiftPlan, EQUIPMENT_LABEL, TIMEFRAME_LABEL } from "@/lib/lift-plan";
import { Plus, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<LiftPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("lift_plans")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setPlans(data);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Your lift plans</h1>
            <p className="text-muted-foreground">Track submissions and reviews</p>
          </div>
          <Button asChild size="lg">
            <Link to="/dashboard/new">
              <Plus className="mr-2 size-4" /> Submit new lift plan
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No lift plans yet</h2>
            <p className="text-muted-foreground mb-4">Submit your first plan to get a review.</p>
            <Button asChild>
              <Link to="/dashboard/new">
                <Plus className="mr-2 size-4" /> Submit lift plan
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {plans.map((p) => (
              <Link key={p.id} to={`/dashboard/${p.id}`}>
                <Card className="p-5 hover:shadow-md hover:border-primary transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg truncate">{p.reference}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>{EQUIPMENT_LABEL[p.equipment_type]}</span>
                        <span>•</span>
                        <span>{TIMEFRAME_LABEL[p.timeframe]}</span>
                        <span>•</span>
                        <span>Submitted {format(new Date(p.created_at), "dd MMM yyyy, HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
