import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LiftPlan,
  LiftPlanStatus,
  STATUS_LABEL,
  EQUIPMENT_LABEL,
  TIMEFRAME_LABEL,
} from "@/lib/lift-plan";
import { format } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  MessageSquare,
  CheckCircle2,
  Send,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface FileRow {
  id: string;
  file_path: string;
  file_name: string;
  is_review_document: boolean;
  created_at: string;
  uploaded_by: string;
}
interface HistoryRow {
  id: string;
  from_status: LiftPlanStatus | null;
  to_status: LiftPlanStatus;
  note: string | null;
  created_at: string;
  changed_by: string;
}
interface MessageRow {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
}

const STATUS_OPTIONS: LiftPlanStatus[] = [
  "submitted",
  "assigned",
  "in_review",
  "request_info",
  "rejected",
  "completed",
];

const LiftPlanDetail = ({ reviewerView = false }: { reviewerView?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isReviewer } = useAuth();

  const [plan, setPlan] = useState<LiftPlan | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LiftPlanStatus>("in_review");
  const [statusNote, setStatusNote] = useState("");
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [acting, setActing] = useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data: p }, { data: f }, { data: h }, { data: m }] = await Promise.all([
      supabase.from("lift_plans").select("*").eq("id", id).maybeSingle(),
      supabase.from("lift_plan_files").select("*").eq("lift_plan_id", id).order("created_at"),
      supabase.from("status_history").select("*").eq("lift_plan_id", id).order("created_at"),
      supabase.from("messages").select("*").eq("lift_plan_id", id).order("created_at"),
    ]);
    setPlan(p as LiftPlan | null);
    setFiles((f as FileRow[]) ?? []);
    setHistory((h as HistoryRow[]) ?? []);
    setMessages((m as MessageRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const downloadFile = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("lift-plan-files").createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  const assignToMe = async () => {
    if (!plan || !user) return;
    setActing(true);
    const { error } = await supabase
      .from("lift_plans")
      .update({ assigned_to: user.id, status: "assigned", assigned_at: new Date().toISOString() })
      .eq("id", plan.id);
    if (!error) {
      await supabase.from("status_history").insert({
        lift_plan_id: plan.id,
        changed_by: user.id,
        from_status: plan.status,
        to_status: "assigned",
        note: "Assigned to reviewer",
      });
      toast.success("Plan assigned to you");
      await load();
    } else toast.error(error.message);
    setActing(false);
  };

  const openStatus = (s: LiftPlanStatus) => {
    setNewStatus(s);
    setStatusNote("");
    setStatusFile(null);
    setStatusOpen(true);
  };

  const updateStatus = async () => {
    if (!plan || !user) return;
    if (newStatus === "request_info" && !statusNote.trim()) {
      toast.error("Please describe what info is needed");
      return;
    }
    if (newStatus === "completed" && !statusFile) {
      toast.error("Please upload the review document");
      return;
    }
    setActing(true);
    try {
      const updates: Partial<LiftPlan> = { status: newStatus };
      if (newStatus === "completed") updates.completed_at = new Date().toISOString();

      const { error: upErr } = await supabase.from("lift_plans").update(updates).eq("id", plan.id);
      if (upErr) throw upErr;

      await supabase.from("status_history").insert({
        lift_plan_id: plan.id,
        changed_by: user.id,
        from_status: plan.status,
        to_status: newStatus,
        note: statusNote.trim() || null,
      });

      if (newStatus === "request_info" && statusNote.trim()) {
        await supabase.from("messages").insert({
          lift_plan_id: plan.id,
          sender_id: user.id,
          body: statusNote.trim(),
        });
      }

      if (newStatus === "completed" && statusFile) {
        const path = `${plan.client_id}/${plan.id}/review-${Date.now()}-${statusFile.name}`;
        const { error: upE } = await supabase.storage
          .from("lift-plan-files")
          .upload(path, statusFile);
        if (upE) throw upE;
        await supabase.from("lift_plan_files").insert({
          lift_plan_id: plan.id,
          uploaded_by: user.id,
          file_path: path,
          file_name: statusFile.name,
          file_size: statusFile.size,
          mime_type: statusFile.type,
          is_review_document: true,
        });
      }

      toast.success(`Status updated to ${STATUS_LABEL[newStatus]}`);
      setStatusOpen(false);
      await load();
    } catch (err) {
      const e = err as Error;
      toast.error(e.message);
    } finally {
      setActing(false);
    }
  };

  const sendReply = async () => {
    if (!plan || !user || !reply.trim()) return;
    setSendingReply(true);
    const { error } = await supabase.from("messages").insert({
      lift_plan_id: plan.id,
      sender_id: user.id,
      body: reply.trim(),
    });
    if (!error) {
      setReply("");
      await load();
      toast.success("Message sent");
    } else toast.error(error.message);
    setSendingReply(false);
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

  if (!plan) {
    return (
      <AppLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Lift plan not found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
        </div>
      </AppLayout>
    );
  }

  const reviewDocs = files.filter((f) => f.is_review_document);
  const submittedFiles = files.filter((f) => !f.is_review_document);
  const showRequestInfoForClient = plan.status === "request_info" && !reviewerView;

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold">{plan.reference}</h1>
              <StatusBadge status={plan.status} />
            </div>
            <p className="text-muted-foreground">
              Submitted {format(new Date(plan.created_at), "dd MMM yyyy 'at' HH:mm")}
            </p>
          </div>

          {reviewerView && isReviewer && (
            <div className="flex gap-2 flex-wrap">
              {!plan.assigned_to && (
                <Button onClick={assignToMe} disabled={acting}>
                  <UserCheck className="mr-2 size-4" /> Assign to me
                </Button>
              )}
              {plan.assigned_to === user?.id && (
                <Select onValueChange={(v) => openStatus(v as LiftPlanStatus)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== plan.status).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Details</h2>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Equipment</dt><dd className="font-medium">{EQUIPMENT_LABEL[plan.equipment_type]}</dd></div>
                <div><dt className="text-muted-foreground">Timeframe</dt><dd className="font-medium">{TIMEFRAME_LABEL[plan.timeframe]}</dd></div>
                <div><dt className="text-muted-foreground">Payment</dt><dd className="font-medium capitalize">{plan.payment_type === "po" ? `PO: ${plan.po_number}` : "Direct payment"}</dd></div>
                <div><dt className="text-muted-foreground">Payment status</dt><dd className="font-medium capitalize">{plan.payment_status.replace("_", " ")}</dd></div>
                {plan.assigned_at && <div><dt className="text-muted-foreground">Assigned at</dt><dd className="font-medium">{format(new Date(plan.assigned_at), "dd MMM yyyy HH:mm")}</dd></div>}
                {plan.completed_at && <div><dt className="text-muted-foreground">Completed at</dt><dd className="font-medium">{format(new Date(plan.completed_at), "dd MMM yyyy HH:mm")}</dd></div>}
              </dl>
              {plan.description && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-muted-foreground text-sm mb-1">Description</dt>
                  <dd className="text-sm whitespace-pre-wrap">{plan.description}</dd>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText className="size-4" /> Submitted files</h2>
              {submittedFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files</p>
              ) : (
                <ul className="space-y-2">
                  {submittedFiles.map((f) => (
                    <li key={f.id} className="flex items-center justify-between bg-secondary rounded px-3 py-2 text-sm">
                      <span className="truncate">{f.file_name}</span>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(f.file_path, f.file_name)}>
                        <Download className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {reviewDocs.length > 0 && (
              <Card className="p-6 border-success border-2">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-success">
                  <CheckCircle2 className="size-4" /> Review documents
                </h2>
                <ul className="space-y-2">
                  {reviewDocs.map((f) => (
                    <li key={f.id} className="flex items-center justify-between bg-success/10 rounded px-3 py-2 text-sm">
                      <span className="truncate font-medium">{f.file_name}</span>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(f.file_path, f.file_name)}>
                        <Download className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {messages.length > 0 || showRequestInfoForClient ? (
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="size-4" /> Messages</h2>
                <div className="space-y-3 mb-4">
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`text-xs mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {format(new Date(m.created_at), "dd MMM, HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(plan.status === "request_info" || reviewerView) && (
                  <div className="flex gap-2">
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." rows={2} />
                    <Button onClick={sendReply} disabled={sendingReply || !reply.trim()}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Activity</h2>
              <ol className="relative border-l-2 border-border ml-2 space-y-4">
                <li className="ml-4">
                  <div className="absolute -left-[7px] size-3 rounded-full bg-info ring-4 ring-background" />
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(plan.created_at), "dd MMM yyyy, HH:mm")}</p>
                </li>
                {history.map((h) => (
                  <li key={h.id} className="ml-4 relative">
                    <div className="absolute -left-[23px] size-3 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-medium">
                      {h.from_status ? `${STATUS_LABEL[h.from_status]} → ` : ""}{STATUS_LABEL[h.to_status]}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(h.created_at), "dd MMM yyyy, HH:mm")}</p>
                    {h.note && <p className="text-xs mt-1 italic">"{h.note}"</p>}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update to {STATUS_LABEL[newStatus]}</DialogTitle>
            <DialogDescription>
              {newStatus === "request_info" && "Describe what additional information is needed from the client."}
              {newStatus === "completed" && "Upload the final signed-off review document."}
              {newStatus === "rejected" && "Optionally explain why this plan is being rejected."}
              {!["request_info", "completed", "rejected"].includes(newStatus) && "Optional note for the activity log."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {newStatus === "completed" && (
              <div>
                <Label>Review document *</Label>
                <Input type="file" onChange={(e) => setStatusFile(e.target.files?.[0] ?? null)} />
              </div>
            )}
            <div>
              <Label>Note {newStatus === "request_info" && "*"}</Label>
              <Textarea rows={4} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={updateStatus} disabled={acting}>
              {acting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default LiftPlanDetail;
