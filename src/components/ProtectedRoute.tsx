import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  requireReviewer,
}: {
  children: ReactNode;
  requireReviewer?: boolean;
}) {
  const { user, loading, isReviewer } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (requireReviewer && !isReviewer) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
