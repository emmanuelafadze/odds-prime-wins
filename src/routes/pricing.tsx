import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { useAuth } from "@/lib/auth";
import { payWithPaystack } from "@/lib/paystack";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — ODDSPrime" }, { name: "description", content: "Transparent pricing for ODDSPrime predictions in Ghana Cedis." }] }),
  component: Pricing,
});

function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();

  const buy = async (key: keyof typeof PRICING) => {
    if (!user) { nav({ to: "/login" }); return; }
    const p = PRICING[key];
    await payWithPaystack({
      email: user.email!,
      amountGhs: p.price,
      metadata: { tier: p.tier, name: p.name },
      onSuccess: async (ref) => {
        const today = new Date().toISOString().slice(0, 10);
        const expiresAt = key === "premium"
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
          : new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        const { error } = await supabase.from("purchases").insert({
          user_id: user.id, tier: p.tier, amount_ghs: p.price,
          reference: ref, match_date: today, expires_at: expiresAt,
        });
        if (error) toast.error(error.message);
        else { toast.success("Payment successful! Access granted."); nav({ to: "/dashboard" }); }
      },
    });
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Pricing in Ghana Cedis</h1>
          <p className="mt-3 text-muted-foreground">Pay-per-tip. Pay once, win smart.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Object.entries(PRICING).map(([k, p]) => (
            <Card key={k} className={`flex flex-col p-6 ${k === "premium" ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-[var(--shadow-elegant)]" : ""}`}>
              {k === "premium" && <span className="mb-2 self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">PREMIUM</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 text-4xl font-extrabold">GHS {p.price}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified analysis</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant unlock</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {k === "premium" ? "3 picks in a row" : "24-hour access"}</li>
              </ul>
              <Button className="mt-6" onClick={() => buy(k as keyof typeof PRICING)}>Buy with Paystack</Button>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">Not signed in? <Link to="/signup" className="text-primary hover:underline">Create account</Link></p>
      </section>
    </SiteLayout>
  );
}
