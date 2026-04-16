import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck,
  Upload,
  ClipboardCheck,
  FileCheck2,
  ArrowRight,
  HardHat,
} from "lucide-react";
import { EQUIPMENT_OPTIONS } from "@/lib/lift-plan";

const Landing = () => {
  const { user, isReviewer } = useAuth();
  const dashLink = isReviewer ? "/review-requests" : "/dashboard";

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" aria-hidden />
        <div className="container py-20 md:py-32 text-primary-foreground">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck className="size-3.5" /> Independent Appointed Person Reviews
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-[1.05]">
              Compliant lift plans, <span className="text-accent">reviewed fast.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 mb-8 max-w-2xl">
              Submit your lift plan for tower cranes, mobile cranes, MEWPs, forklifts and more.
              UK-qualified Appointed Persons review and return signed-off documentation in as
              little as 24 hours.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link to={dashLink}>
                    Go to {isReviewer ? "Review Requests" : "Dashboard"}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/auth?mode=signup">Get started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">How it works</h2>
          <p className="text-muted-foreground text-lg">
            Three simple steps from upload to signed review document.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Upload,
              title: "1. Submit",
              text: "Upload your lift plan and supporting documents through your secure dashboard.",
            },
            {
              icon: ClipboardCheck,
              title: "2. Review",
              text: "An Appointed Person assigns themselves and reviews your plan against current UK standards.",
            },
            {
              icon: FileCheck2,
              title: "3. Completed",
              text: "Receive your signed-off review document or feedback for revisions.",
            },
          ].map((s) => (
            <Card key={s.title} className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="size-12 rounded-lg bg-primary text-primary-foreground grid place-items-center mb-4">
                <s.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="bg-secondary/40 border-y">
        <div className="container py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Equipment we cover</h2>
            <p className="text-muted-foreground text-lg">
              Every lifting operation requiring an Appointed Person under LOLER & BS 7121.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {EQUIPMENT_OPTIONS.map((e) => (
              <Card key={e.value} className="p-5 text-center hover:border-primary transition-colors">
                <HardHat className="size-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">{e.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get your plan reviewed?</h2>
        <p className="text-muted-foreground mb-8 text-lg max-w-xl mx-auto">
          Sign up in seconds and submit your first lift plan today.
        </p>
        {!user && (
          <Button asChild size="lg">
            <Link to="/auth?mode=signup">Create account</Link>
          </Button>
        )}
      </section>
    </AppLayout>
  );
};

export default Landing;
