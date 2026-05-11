import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { HardHat, Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for a password reset link");
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
          <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm">
                If an account exists for <strong>{email}</strong>, a reset link is on its way.
              </p>
              <Link to="/auth" className="text-sm text-primary underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send reset link
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
