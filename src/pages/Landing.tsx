import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-cranes.jpg";
import {
  ShieldCheck,
  ArrowRight,
  HardHat,
  ClipboardCheck,
  PencilRuler,
} from "lucide-react";
import { EQUIPMENT_OPTIONS } from "@/lib/lift-plan";
import { WRITE_EQUIPMENT_AVAILABLE } from "@/lib/lift-plan-write";

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
        <div className="container py-16 sm:py-24 md:py-32 text-primary-foreground relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 backdrop-blur border border-accent/30 text-accent text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] mb-6 sm:mb-8">
              <span className="size-1.5 rounded-full bg-accent shadow-glow" />
              UK Appointed Person Services
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-5 sm:mb-6 leading-[0.95] text-balance">
              Lift plans,
              <br />
              <span className="italic font-display bg-gradient-to-r from-accent to-accent bg-clip-text text-transparent">
                reviewed or written.
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/75 mb-8 sm:mb-10 max-w-2xl leading-relaxed">
              Independent UK Appointed Persons either review your existing lift plan or write
              one for you from scratch — for tower cranes, mobile cranes, MEWPs, forklifts and more.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-7 text-base"
                >
                  <Link to={dashLink}>
                    Go to {isReviewer ? "Requests" : "Dashboard"}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-7 text-base"
                  >
                    <Link to="/auth?mode=signup">
                      Get started <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-primary-foreground border-primary-foreground/25 hover:bg-primary-foreground/10 hover:text-primary-foreground h-12 px-7 text-base"
                  >
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-foreground/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" /> LOLER & BS 7121 compliant
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" /> 24h turnaround available
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" /> Qualified Appointed Persons
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two services */}
      <section className="container py-14 sm:py-20 md:py-28">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">
            Two services
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
            Pick what you need.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {/* Review card */}
          <Card
            className="group relative p-6 sm:p-8 border-border/60 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 overflow-hidden"
            style={{ background: "var(--gradient-card)" }}
          >
            <div className="absolute top-0 right-0 text-[8rem] font-display font-bold leading-none text-primary/5 group-hover:text-primary/10 transition-colors -mt-4 mr-2 select-none">
              01
            </div>
            <div className="relative">
              <div className="size-14 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <ClipboardCheck className="size-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Review my lift plan</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You've written the lift plan — we check it against current UK standards and return
                signed-off feedback or revisions.
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-primary mt-0.5 shrink-0" />
                  All equipment types supported
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-primary mt-0.5 shrink-0" />
                  Submitted → Reviewed → Completed
                </li>
              </ul>
              <Button asChild size="lg" className="w-full">
                <Link to={user ? "/dashboard/new" : "/auth?mode=signup"}>
                  Submit a plan for review <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Write card */}
          <Card
            className="group relative p-6 sm:p-8 border-accent/40 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 overflow-hidden"
            style={{ background: "var(--gradient-card)" }}
          >
            <div className="absolute top-0 right-0 text-[8rem] font-display font-bold leading-none text-accent/5 group-hover:text-accent/10 transition-colors -mt-4 mr-2 select-none">
              02
            </div>
            <div className="relative">
              <div className="size-14 rounded-xl bg-accent text-accent-foreground grid place-items-center mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                <PencilRuler className="size-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Write me a lift plan</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Send us the details, photos and files. An AP writes the lift plan, delivers a draft,
                and finalises after your approval.
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-accent mt-0.5 shrink-0" />
                  Forklift available now — others coming soon
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-accent mt-0.5 shrink-0" />
                  Submitted → Assigned → Draft → Completed
                </li>
              </ul>
              <Button
                asChild
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to={user ? "/writes/new" : "/auth?mode=signup"}>
                  Request a written plan <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Equipment */}
      <section className="relative border-y border-border/60 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh opacity-60" aria-hidden />
        <div className="container py-14 sm:py-20 md:py-24">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">
              Coverage
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
              Every lifting operation under LOLER & BS 7121.
            </h2>
            <p className="text-muted-foreground">
              Reviews are available across all equipment. Written plans are rolling out — forklift
              first, others coming soon.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EQUIPMENT_OPTIONS.map((e) => {
              const writeAvailable = WRITE_EQUIPMENT_AVAILABLE[e.value];
              return (
                <Card
                  key={e.value}
                  className="group relative p-6 text-center border-border/60 hover:border-accent hover:shadow-glow transition-all duration-300 cursor-default bg-card/80 backdrop-blur"
                >
                  <HardHat className="size-9 mx-auto mb-3 text-primary group-hover:text-accent transition-colors" />
                  <p className="font-semibold text-sm">{e.label}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-2 font-semibold">
                    {writeAvailable ? (
                      <span className="text-success">Review · Write</span>
                    ) : (
                      <span className="text-muted-foreground">Review · Write soon</span>
                    )}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-24 md:py-32">
        <Card
          className="relative overflow-hidden border-0 p-8 sm:p-12 md:p-20 text-center text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-balance">
              Ready when you are.
            </h2>
            <p className="text-primary-foreground/75 mb-8 text-base sm:text-lg">
              Sign up in seconds — submit a plan for review or request one to be written.
            </p>
            {!user ? (
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-8 text-base"
              >
                <Link to="/auth?mode=signup">
                  Create account <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow h-12 px-8 text-base"
              >
                <Link to={dashLink}>
                  Go to {isReviewer ? "Requests" : "Dashboard"}{" "}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </section>
    </AppLayout>
  );
};

export default Landing;
