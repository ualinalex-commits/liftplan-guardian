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
        <div className="absolute inset-0 -z-10 bg-grid opacity-[0.07]" aria-hidden />
        <div className="container py-24 md:py-36 text-primary-foreground relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 backdrop-blur border border-accent/30 text-accent text-[11px] font-semibold uppercase tracking-[0.18em] mb-8">
              <span className="size-1.5 rounded-full bg-accent shadow-glow" />
              Independent UK Appointed Person Reviews
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[0.95] text-balance">
              Lift plans,
              <br />
              <span className="italic font-display bg-gradient-to-r from-accent via-accent to-orange-400 bg-clip-text text-transparent">reviewed properly.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/75 mb-10 max-w-2xl leading-relaxed">
              Submit your lift plan for tower cranes, mobile cranes, MEWPs, forklifts and more.
              UK-qualified Appointed Persons return signed-off documentation in as little as 24 hours.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-7 text-base">
                  <Link to={dashLink}>
                    Go to {isReviewer ? "Review Requests" : "Dashboard"}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-7 text-base">
                    <Link to="/auth?mode=signup">Get started <ArrowRight className="ml-1 size-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/25 hover:bg-primary-foreground/10 hover:text-primary-foreground h-12 px-7 text-base">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-foreground/60">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> LOLER & BS 7121 compliant</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> 24h turnaround available</div>
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> Qualified Appointed Persons</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">The process</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Three steps from upload to signed-off plan.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Upload, title: "Submit", text: "Upload your lift plan and supporting documents through your secure dashboard." },
            { icon: ClipboardCheck, title: "Review", text: "An Appointed Person assigns themselves and reviews against current UK standards." },
            { icon: FileCheck2, title: "Complete", text: "Receive your signed-off review document or detailed feedback for revisions." },
          ].map((s, i) => (
            <Card key={s.title} className="group relative p-7 border-border/60 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 overflow-hidden" style={{ background: "var(--gradient-card)" }}>
              <div className="absolute top-0 right-0 text-[7rem] font-display font-bold leading-none text-accent/5 group-hover:text-accent/10 transition-colors -mt-4 mr-2 select-none">{i+1}</div>
              <div className="relative">
                <div className="size-12 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <s.icon className="size-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="relative border-y border-border/60 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-60" aria-hidden />
        <div className="container py-20 md:py-24">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Coverage</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Every lifting operation under LOLER & BS 7121.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EQUIPMENT_OPTIONS.map((e) => (
              <Card key={e.value} className="group p-6 text-center border-border/60 hover:border-accent hover:shadow-glow transition-all duration-300 cursor-default bg-card/80 backdrop-blur">
                <HardHat className="size-9 mx-auto mb-3 text-primary group-hover:text-accent transition-colors" />
                <p className="font-semibold text-sm">{e.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-24 md:py-32">
        <Card className="relative overflow-hidden border-0 p-12 md:p-20 text-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-5 text-balance">Ready to get your plan reviewed?</h2>
            <p className="text-primary-foreground/75 mb-8 text-lg">
              Sign up in seconds and submit your first lift plan today.
            </p>
            {!user ? (
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-8 text-base">
                <Link to="/auth?mode=signup">Create account <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-8 text-base">
                <Link to={dashLink}>Go to {isReviewer ? "Review Requests" : "Dashboard"} <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
            )}
          </div>
        </Card>
      </section>
    </AppLayout>
  );
};

export default Landing;
