import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LiftPlan, EQUIPMENT_LABEL, TIMEFRAME_LABEL, LiftPlanStatus } from "@/lib/lift-plan";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface PlanWithProfile extends LiftPlan {
  profiles: { full_name: string; company: string | null; email: string } | null;
}

const ReviewRequests = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("queue");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lift_plans")
        .select("*, profiles!lift_plans_client_id_fkey(full_name, company, email)")
        .order("created_at", { ascending: false });
      if (!error && data) setPlans(data as unknown as PlanWithProfile[]);
      setLoading(false);
    })();
  }, []);

  const queue = plans.filter((p) => p.status === "submitted");
  const mine = plans.filter((p) => p.assigned_to === user?.id && p.status !== "completed" && p.status !== "rejected");
  const all = plans;

  const renderList = (list: PlanWithProfile[]) =>
    list.length === 0 ? (
      <Card className="p-12 text-center border-dashed border-2">
        <ClipboardList className="size-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No lift plans here</p>
      </Card>
    ) : (
      <div className="grid gap-3">
        {list.map((p) => (
          <Link key={p.id} to={`/review-requests/${p.id}`}>
            <Card className="p-5 hover:shadow-md hover:border-primary transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{p.reference}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-medium text-foreground">{p.profiles?.company || p.profiles?.full_name}</span>
                    <span>{EQUIPMENT_LABEL[p.equipment_type]}</span>
                    <span>{TIMEFRAME_LABEL[p.timeframe]}</span>
                    <span>{format(new Date(p.created_at), "dd MMM, HH:mm")}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Review Requests</h1>
          <p className="text-muted-foreground">Lift plans awaiting Appointed Person review</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="queue">Queue ({queue.length})</TabsTrigger>
              <TabsTrigger value="mine">Assigned to me ({mine.length})</TabsTrigger>
              <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="mt-4">{renderList(queue)}</TabsContent>
            <TabsContent value="mine" className="mt-4">{renderList(mine)}</TabsContent>
            <TabsContent value="all" className="mt-4">{renderList(all)}</TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default ReviewRequests;
