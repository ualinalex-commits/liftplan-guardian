import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LiftPlan, EQUIPMENT_LABEL, TIMEFRAME_LABEL } from "@/lib/lift-plan";
import { LiftPlanWrite } from "@/lib/lift-plan-write";
import { Plus, Loader2, FileText, ClipboardCheck, PencilRuler } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<LiftPlan[]>([]);
  const [writes, setWrites] = useState<LiftPlanWrite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: planData }, { data: writeData }] = await Promise.all([
        supabase
          .from("lift_plans")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("lift_plan_writes")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (planData) setPlans(planData);
      if (writeData) setWrites(writeData);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your dashboard</h1>
          <p className="text-muted-foreground">Reviews and written lift plans in one place</p>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="reviews">
            <TabsList>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <ClipboardCheck className="size-4" /> Reviews ({plans.length})
              </TabsTrigger>
              <TabsTrigger value="writes" className="flex items-center gap-2">
                <PencilRuler className="size-4" /> Written plans ({writes.length})
              </TabsTrigger>
            </TabsList>

            {/* REVIEWS */}
            <TabsContent value="reviews" className="mt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Lift plan reviews</h2>
                  <p className="text-sm text-muted-foreground">
                    Submit your own plan for an AP to review
                  </p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/new">
                    <Plus className="mr-2 size-4" /> Submit lift plan
                  </Link>
                </Button>
              </div>

              {plans.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-1">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Submit your first plan to get a review.
                  </p>
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
                              <span>
                                Submitted{" "}
                                {format(new Date(p.created_at), "dd MMM yyyy, HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* WRITES */}
            <TabsContent value="writes" className="mt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Written lift plans</h2>
                  <p className="text-sm text-muted-foreground">
                    Ask an AP to author a lift plan for you
                  </p>
                </div>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/writes/new">
                    <Plus className="mr-2 size-4" /> Request written plan
                  </Link>
                </Button>
              </div>

              {writes.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <PencilRuler className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-1">No written plans yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Currently available for telehandler and MEWP lifts.
                  </p>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/writes/new">
                      <Plus className="mr-2 size-4" /> Request written plan
                    </Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {writes.map((w) => (
                    <Link key={w.id} to={`/writes/${w.id}`}>
                      <Card className="p-5 hover:shadow-md hover:border-accent transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-lg truncate">{w.reference}</h3>
                              <StatusBadge status={w.status} kind="write" />
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                              <span>{EQUIPMENT_LABEL[w.equipment_type]}</span>
                              <span>•</span>
                              <span>{TIMEFRAME_LABEL[w.timeframe]}</span>
                              <span>•</span>
                              <span>
                                Submitted{" "}
                                {format(new Date(w.created_at), "dd MMM yyyy, HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
