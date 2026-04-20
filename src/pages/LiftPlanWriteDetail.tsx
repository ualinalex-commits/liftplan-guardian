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
import { EQUIPMENT_LABEL, TIMEFRAME_LABEL } from "@/lib/lift-plan";
import {
  LiftPlanWrite,
  LiftPlanWriteStatus,
  WRITE_STATUS_LABEL,
} from "@/lib/lift-plan-write";
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
  PencilRuler,
} from "lucide-react";
import { toast } from "sonner";

interface FileRow {
  id: string;
  file_path: string;
  file_name: string;
  is_deliverable: boolean;
  created_at: string;
  uploaded_by: string;
}
interface MessageRow {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
}

const STATUS_OPTIONS: LiftPlanWriteStatus[] = [
  "submitted",
  "assigned",
  "request_info",
  "draft_delivered",
  "completed",
];

const LiftPlanWriteDetail = ({ reviewerView = false }: { reviewerView?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isReviewer } = useAuth();

  const [write, setWrite] = useState<LiftPlanWrite | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LiftPlanWriteStatus>("request_info");
  const [statusNote, setStatusNote] = useState("");
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [acting, setActing] = useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data: w }, { data: f }, { data: m }] = await Promise.all([
      supabase.from("lift_plan_writes").select("*").eq("id", id).maybeSingle(),
      supabase.from("lift_plan_write_files").select("*").eq("lift_plan_write_id", id).order("created_at"),
      supabase.from("write_messages").select("*").eq("lift_plan_write_id", id).order("created_at"),
    ]);
    setWrite(w as LiftPlanWrite | null);
    setFiles((f as FileRow[]) ?? []);
    setMessages((m as MessageRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!id) return;
    const channel = supabase
      .channel(`lift-plan-write-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "write_messages",
          filter: `lift_plan_write_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as MessageRow).id)
              ? prev
              : [...prev, payload.new as MessageRow],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const downloadFile = async (path: string, name: string) => {
    const { data, error } = await supabase.storage
      .from("lift-plan-write-files")
      .createSignedUrl(path, 60);
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
    if (!write || !user) return;
    setActing(true);
    const { error } = await supabase
      .from("lift_plan_writes")
      .update({
        assigned_to: user.id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", write.id);
    if (!error) {
      toast.success("Assigned to you");
      await load();
    } else toast.error(error.message);
    setActing(false);
  };

  const openStatus = (s: LiftPlanWriteStatus) => {
    setNewStatus(s);
    setStatusNote("");
    setStatusFile(null);
    setStatusOpen(true);
  };

  const updateStatus = async () => {
    if (!write || !user) return;
    if (newStatus === "request_info" && !statusNote.trim()) {
      toast.error("Please describe what info is needed");
      return;
    }
    if (newStatus === "draft_delivered" && !statusFile) {
      toast.error("Please upload the draft lift plan");
      return;
    }
    setActing(true);
    try {
      const updates: Partial<LiftPlanWrite> = { status: newStatus };
      if (newStatus === "completed") updates.completed_at = new Date().toISOString();

      const { error: upErr } = await supabase
        .from("lift_plan_writes")
        .update(updates)
        .eq("id", write.id);
      if (upErr) throw upErr;

      if (newStatus === "request_info" && statusNote.trim()) {
        await supabase.from("write_messages").insert({
          lift_plan_write_id: write.id,
          sender_id: user.id,
          body: statusNote.trim(),
        });
      }

      if (newStatus === "draft_delivered" && statusFile) {
        const path = `${write.client_id}/${write.id}/draft-${Date.now()}-${statusFile.name}`;
        const { error: upE } = await supabase.storage
          .from("lift-plan-write-files")
          .upload(path, statusFile);
        if (upE) throw upE;
        await supabase.from("lift_plan_write_files").insert({
          lift_plan_write_id: write.id,
          uploaded_by: user.id,
          file_path: path,
          file_name: statusFile.name,
          file_size: statusFile.size,
          mime_type: statusFile.type,
          is_deliverable: true,
        });
        if (statusNote.trim()) {
          await supabase.from("write_messages").insert({
            lift_plan_write_id: write.id,
            sender_id: user.id,
            body: statusNote.trim(),
          });
        }
      }

      toast.success(`Status updated to ${WRITE_STATUS_LABEL[newStatus]}`);
      setStatusOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActing(false);
    }
  };

  const sendReply = async () => {
    if (!write || !user || !reply.trim()) return;
    setSendingReply(true);
    const { error } = await supabase.from("write_messages").insert({
      lift_plan_write_id: write.id,
      sender_id: user.id,
      body: reply.trim(),
    });
    if (!error) {
      setReply("");
      await load();
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
  if (!write) {
    return (
      <AppLayout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Write request not found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const deliverables = files.filter((f) => f.is_deliverable);
  const submittedFiles = files.filter((f) => !f.is_deliverable);
  const canChat = reviewerView || write.client_id === user?.id;
  const chatLocked = write.status === "completed";

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <PencilRuler className="size-6 text-accent" />
              <h1 className="text-3xl font-bold">{write.reference}</h1>
              <StatusBadge status={write.status} kind="write" />
            </div>
            <p className="text-muted-foreground">
              Submitted {format(new Date(write.created_at), "dd MMM yyyy 'at' HH:mm")}
            </p>
          </div>

          {reviewerView && isReviewer && (
            <div className="flex gap-2 flex-wrap">
              {!write.assigned_to && (
                <Button onClick={assignToMe} disabled={acting}>
                  <UserCheck className="mr-2 size-4" /> Assign to me
                </Button>
              )}
              {write.assigned_to === user?.id && (
                <Select onValueChange={(v) => openStatus(v as LiftPlanWriteStatus)}>
                  <SelectTrigger className="w-[210px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== write.status).map((s) => (
                      <SelectItem key={s} value={s}>
                        {WRITE_STATUS_LABEL[s]}
                      </SelectItem>
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
                <div>
                  <dt className="text-muted-foreground">Equipment</dt>
                  <dd className="font-medium">{EQUIPMENT_LABEL[write.equipment_type]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timeframe</dt>
                  <dd className="font-medium">{TIMEFRAME_LABEL[write.timeframe]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Payment</dt>
                  <dd className="font-medium">
                    {write.payment_type === "po" ? `PO: ${write.po_number}` : "Direct payment"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd className="font-medium capitalize">
                    {write.payment_status.replace("_", " ")}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t">
                <dt className="text-muted-foreground text-sm mb-1">Lift description</dt>
                <dd className="text-sm whitespace-pre-wrap">{write.details}</dd>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="size-4" /> Client uploads
              </h2>
              {submittedFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files uploaded</p>
              ) : (
                <ul className="space-y-2">
                  {submittedFiles.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between bg-secondary rounded px-3 py-2 text-sm"
                    >
                      <span className="truncate">{f.file_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(f.file_path, f.file_name)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {deliverables.length > 0 && (
              <Card className="p-6 border-success border-2">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-success">
                  <CheckCircle2 className="size-4" /> Delivered lift plans
                </h2>
                <ul className="space-y-2">
                  {deliverables.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between bg-success/10 rounded px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{f.file_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(f.file_path, f.file_name)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {canChat && (
              <Card className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="size-4" /> Chat
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {reviewerView
                      ? "Talking with client"
                      : write.assigned_to
                      ? "Talking with your AP"
                      : "AP not yet assigned"}
                  </span>
                </h2>
                <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No messages yet.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              mine ? "bg-primary text-primary-foreground" : "bg-secondary"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p
                              className={`text-xs mt-1 ${
                                mine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(m.created_at), "dd MMM, HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {chatLocked ? (
                  <p className="text-xs text-muted-foreground text-center">
                    Chat is closed because this request is completed.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type a message..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <Button onClick={sendReply} disabled={sendingReply || !reply.trim()}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Activity</h2>
              <ol className="relative border-l-2 border-border ml-2 space-y-4">
                <li className="ml-4 relative">
                  <div className="absolute -left-[23px] size-3 rounded-full bg-info ring-4 ring-background" />
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(write.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </li>
                {write.assigned_at && (
                  <li className="ml-4 relative">
                    <div className="absolute -left-[23px] size-3 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm font-medium">Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(write.assigned_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </li>
                )}
                {write.completed_at && (
                  <li className="ml-4 relative">
                    <div className="absolute -left-[23px] size-3 rounded-full bg-success ring-4 ring-background" />
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(write.completed_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </li>
                )}
              </ol>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update to {WRITE_STATUS_LABEL[newStatus]}</DialogTitle>
            <DialogDescription>
              {newStatus === "request_info" && "Tell the client what additional info you need."}
              {newStatus === "draft_delivered" && "Upload the draft lift plan for client review."}
              {newStatus === "completed" && "Mark this request as completed."}
              {newStatus === "assigned" && "Move back to assigned."}
              {newStatus === "submitted" && "Move back to submitted."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(newStatus === "request_info" || newStatus === "draft_delivered") && (
              <div>
                <Label>Note {newStatus === "request_info" && "*"}</Label>
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={4}
                  placeholder={
                    newStatus === "request_info"
                      ? "What information is missing?"
                      : "Optional note for the client"
                  }
                />
              </div>
            )}
            {newStatus === "draft_delivered" && (
              <div>
                <Label>Draft lift plan file *</Label>
                <Input
                  type="file"
                  onChange={(e) => setStatusFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStatus} disabled={acting}>
              {acting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default LiftPlanWriteDetail;
