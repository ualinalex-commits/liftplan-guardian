import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (data.valid) setState({ kind: "valid" });
        else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "invalid" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState({ kind: "success" });
      else if (data?.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: "Could not unsubscribe" });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Unsubscribe</h1>
        {state.kind === "loading" && (
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Checking your link…
          </p>
        )}
        {state.kind === "valid" && (
          <>
            <p className="text-muted-foreground">
              Click below to stop receiving emails from ADA Lifting UK.
            </p>
            <Button onClick={confirm} size="lg">Confirm unsubscribe</Button>
          </>
        )}
        {state.kind === "submitting" && (
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Processing…
          </p>
        )}
        {state.kind === "success" && (
          <p>You've been unsubscribed. You won't receive further emails from us.</p>
        )}
        {state.kind === "already" && (
          <p>This email address is already unsubscribed.</p>
        )}
        {state.kind === "invalid" && (
          <p className="text-destructive">This unsubscribe link is invalid or has expired.</p>
        )}
        {state.kind === "error" && (
          <p className="text-destructive">{state.message}</p>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
