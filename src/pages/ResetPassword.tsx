import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { HardHat, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in the URL hash and creates a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated — you're signed in");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-6">
          <div className="size-10 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <HardHat className="size-5" />
          </div>
          ADA Lifting
        </Link>
        <Card className="p-6 shadow-xl">
          <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ready
              ? "Choose a new password for your account."
              : "Validating your reset link…"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rp-pw">New password</Label>
              <Input
                id="rp-pw"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
              />
            </div>
            <div>
              <Label htmlFor="rp-pw2">Confirm password</Label>
              <Input
                id="rp-pw2"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !ready}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
