import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { EQUIPMENT_LABEL, TIMEFRAME_LABEL } from "@/lib/lift-plan";
import { LiftPlanWrite } from "@/lib/lift-plan-write";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, PencilRuler } from "lucide-react";
import { format } from "date-fns";

interface WriteWithProfile extends LiftPlanWrite {
  profiles: { full_name: string; company: string | null; email: string } | null;
}

const WriteRequests = () => {
  const { user } = useAuth();
  const [writes, setWrites] = useState<WriteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("queue");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lift_plan_writes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) {
        setLoading(false);
        return;
      }
      const ids = Array.from(new Set(data.map((w) => w.client_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, company, email")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      setWrites(
        data.map((w) => ({ ...w, profiles: byId.get(w.client_id) ?? null })) as WriteWithProfile[],
      );
      setLoading(false);
    })();
  }, []);

  const queue = writes.filter((w) => w.status === "submitted");
  const mine = writes.filter((w) => w.assigned_to === user?.id && w.status !== "completed");
  const all = writes;

  const renderList = (list: WriteWithProfile[]) =>
    list.length === 0 ? (
      <Card className="p-12 text-center border-dashed border-2">
        <PencilRuler className="size-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No write requests here</p>
      </Card>
    ) : (
      <div className="grid gap-3">
        {list.map((w) => (
          <Link key={w.id} to={`/write-requests/${w.id}`}>
            <Card className="p-5 hover:shadow-md hover:border-accent transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{w.reference}</h3>
                    <StatusBadge status={w.status} kind="write" />
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-medium text-foreground">
                      {w.profiles?.company || w.profiles?.full_name}
                    </span>
                    <span>{EQUIPMENT_LABEL[w.equipment_type]}</span>
                    <span>{TIMEFRAME_LABEL[w.timeframe]}</span>
                    <span>{format(new Date(w.created_at), "dd MMM, HH:mm")}</span>
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
        <div className="mb-6 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-accent text-accent-foreground grid place-items-center">
            <PencilRuler className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Write Requests</h1>
            <p className="text-muted-foreground">Clients asking us to author a lift plan</p>
          </div>
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

export default WriteRequests;
