import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crosshair, TrendingUp, ShieldCheck, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { PRICING } from "@/lib/pricing";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 20%, var(--primary), transparent 50%)" }} />
        <div className="container relative mx-auto px-4 py-24 text-center text-navy-foreground md:py-32">
          <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Ghana's #1 Tipster</span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Prime Odds. <span className="text-primary">Smart Wins.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-foreground/80">
            Verified football predictions, daily correct scores and premium accumulators — built for Ghanaian punters. Powered by data, paid in cedis.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/signup"><Button size="lg" className="h-12 px-8 text-base font-semibold shadow-[var(--shadow-elegant)]">Get Started — Free</Button></Link>
            <Link to="/predictions"><Button size="lg" variant="outline" className="h-12 border-primary/40 bg-transparent px-8 text-base text-navy-foreground hover:bg-primary/10">View Predictions <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Crosshair, title: "Accurate Odds", desc: "Hand-picked tips backed by deep data analysis." },
            { icon: TrendingUp, title: "Real-time Updates", desc: "Live status on every match the moment it changes." },
            { icon: ShieldCheck, title: "Trusted & Secure", desc: "Paystack-secured payments in Ghana cedis." },
            { icon: Trophy, title: "Smarter Wins", desc: "Track record of high-margin correct scores." },
          ].map(f => (
            <Card key={f.title} className="border-border/60 p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary"><f.icon className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, Honest Pricing</h2>
            <p className="mt-3 text-muted-foreground">Pay-per-tip in Ghana Cedis. No hidden fees.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(PRICING).map(([k, p]) => (
              <Card key={k} className={`flex flex-col p-6 ${k === "premium" ? "border-primary bg-gradient-to-b from-primary/10 to-transparent" : ""}`}>
                <h3 className="text-base font-semibold">{p.name}</h3>
                <div className="mt-3 text-3xl font-extrabold">GHS {p.price}</div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified pick</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant access</li>
                </ul>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/pricing"><Button size="lg">See Full Pricing</Button></Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
