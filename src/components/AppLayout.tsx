import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { HardHat, LayoutDashboard, ClipboardList, BarChart3, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, isReviewer, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { to: "/", label: "Home", icon: Home, show: true },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !!user && !isReviewer },
    { to: "/review-requests", label: "Review Requests", icon: ClipboardList, show: isReviewer },
    { to: "/management", label: "Management", icon: BarChart3, show: isReviewer },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <HardHat className="size-5" />
            </div>
            <span className="hidden sm:inline">LiftReview</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {profile?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline ml-2">Sign out</span>
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        {/* mobile nav */}
        <nav className="md:hidden border-t flex overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex-1 min-w-[100px] text-center py-2.5 text-xs font-medium flex flex-col items-center gap-1",
                  isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LiftReview · Third-party lift plan reviews
      </footer>
    </div>
  );
}
