import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewLiftPlan from "./pages/NewLiftPlan";
import LiftPlanDetail from "./pages/LiftPlanDetail";
import NewLiftPlanWrite from "./pages/NewLiftPlanWrite";
import LiftPlanWriteDetail from "./pages/LiftPlanWriteDetail";
import WriteRequests from "./pages/WriteRequests";
import ReviewRequests from "./pages/ReviewRequests";
import Management from "./pages/Management";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/new"
              element={<ProtectedRoute><NewLiftPlan /></ProtectedRoute>}
            />
            <Route
              path="/dashboard/:id"
              element={<ProtectedRoute><LiftPlanDetail /></ProtectedRoute>}
            />
            <Route
              path="/writes/new"
              element={<ProtectedRoute><NewLiftPlanWrite /></ProtectedRoute>}
            />
            <Route
              path="/writes/:id"
              element={<ProtectedRoute><LiftPlanWriteDetail /></ProtectedRoute>}
            />
            <Route
              path="/review-requests"
              element={<ProtectedRoute requireReviewer><ReviewRequests /></ProtectedRoute>}
            />
            <Route
              path="/review-requests/:id"
              element={<ProtectedRoute requireReviewer><LiftPlanDetail reviewerView /></ProtectedRoute>}
            />
            <Route
              path="/write-requests"
              element={<ProtectedRoute requireReviewer><WriteRequests /></ProtectedRoute>}
            />
            <Route
              path="/write-requests/:id"
              element={<ProtectedRoute requireReviewer><LiftPlanWriteDetail reviewerView /></ProtectedRoute>}
            />
            <Route
              path="/management"
              element={<ProtectedRoute requireReviewer><Management /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
