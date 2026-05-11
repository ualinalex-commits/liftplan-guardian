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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // Newer Supabase email links: ?code=...
      const code = url.searchParams.get("code");
      // Newer OTP-style links: ?token_hash=...&type=recovery
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") as "recovery" | null;
      // Older hash-style links: #access_token=...&refresh_token=...&type=recovery
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const errDesc = url.searchParams.get("error_description") || hash.get("error_description");

      if (errDesc) {
        setError(errDesc);
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setReady(true);
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          setReady(true);
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setReady(true);
        } else {
          const { data } = await supabase.auth.getSession();
          if (data.session) setReady(true);
          else setError("Invalid or expired reset link. Please request a new one.");
        }
      } catch (e) {
        setError((e as Error).message || "Invalid or expired reset link.");
      }
    })();

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
            {error
              ? error
              : ready
              ? "Choose a new password for your account."
              : "Validating your reset link…"}
          </p>
          {error && (
            <div className="mb-4">
              <Link to="/forgot-password" className="text-sm text-primary underline">
                Request a new reset link
              </Link>
            </div>
          )}
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
