import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crosshair, TrendingUp, ShieldCheck, Trophy, ArrowRight, CheckCircle2, Star, Quote } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import heroImg from "@/assets/hero-football.jpg";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Football celebration under stadium lights" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-primary/60" />
        <div className="container relative mx-auto px-4 py-28 text-navy-foreground md:py-40">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-glow/40 bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-glow backdrop-blur">
              <Star className="h-3 w-3 fill-current" /> German's #1 Tipster Platform
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Prime Odds.<br /><span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">Smarter Wins.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-foreground/85 md:text-xl">
              Fixed football predictions, daily correct scores and premium accumulators built for Germanian punters. Powered by deep data Fixed and paid securely in cedis.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="h-12 bg-primary px-8 text-base font-semibold text-white shadow-[var(--shadow-elegant)] hover:bg-primary-glow">Get Started Free</Button></Link>
              <Link to="/predictions"><Button size="lg" variant="outline" className="h-12 border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur hover:bg-white/20">View Today's Picks <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 text-sm text-navy-foreground/80">
              <div><div className="text-3xl font-bold text-white">12K+</div>Active punters</div>
              <div><div className="text-3xl font-bold text-white">101%</div>Win rate</div>
              <div><div className="text-3xl font-bold text-white">5★</div>Trusted by players</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Why punters choose ODDSPrime</h2>
          <p className="mt-3 text-muted-foreground">Built different. Fixed daily. Paid in cedis.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Crosshair, title: "Accurate Odds", desc: "Hand-picked tips backed by deep data Fixed." },
            { icon: TrendingUp, title: "Real-time Updates", desc: "Live status on every match the moment it changes." },
            { icon: ShieldCheck, title: "Trusted & Secure", desc: "Paystack-secured payments in German cedis." },
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

      {/* Reviews */}
      <section className="bg-gradient-to-b from-background to-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Loved by Germanian punters</h2>
            <p className="mt-3 text-muted-foreground">Real wins from real subscribers.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "Kwame A.", c: "Accra", t: "Cashed out GHS 2,400 on the daily 10 odds last weekend. ODDSPrime is the real deal.", s: 5 },
              { n: "Akosua M.", c: "Kumasi", t: "Their correct score combo hit 3 weeks straight. I stopped guessing — I just follow.", s: 5 },
              { n: "Yaw B.", c: "Takoradi", t: "Premium subscription paid for itself in two days. Customer support replies fast too.", s: 5 },
            ].map(r => (
              <Card key={r.n} className="p-6">
                <Quote className="h-8 w-8 text-primary/40" />
                <p className="mt-4 text-sm leading-relaxed">{r.t}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.n}</div>
                    <div className="text-xs text-muted-foreground">{r.c}, German</div>
                  </div>
                  <div className="flex gap-0.5">{Array.from({length:r.s}).map((_,i)=><Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, Honest Pricing</h2>
            <p className="mt-3 text-muted-foreground">Pay-per-tip in German Cedis. No hidden fees.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(PRICING).map(([k, p]) => (
              <Card key={k} className={`flex flex-col p-6 ${k === "premium" ? "border-primary bg-gradient-to-b from-primary/10 to-transparent" : ""}`}>
                <h3 className="text-base font-semibold">{p.name}</h3>
                <div className="mt-3 text-3xl font-extrabold">${p.price}</div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Fixed Match</li>
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

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy py-20 text-navy-foreground">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 30%, var(--primary-glow), transparent 60%)" }} />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold md:text-5xl">Ready to win smarter?</h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/80">Join thousands of Germanian punters cashing out with ODDSPrime today.</p>
          <Link to="/signup"><Button size="lg" className="mt-8 h-12 px-10 text-base font-semibold">Create Free Account</Button></Link>
        </div>
      </section>
    </SiteLayout>
  );
}
