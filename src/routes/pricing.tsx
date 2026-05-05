import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { useAuth } from "@/lib/auth";
import { payWithPaystack } from "@/lib/paystack";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — ODDSPrime" }, { name: "description", content: "Transparent pricing for ODDSPrime predictions in German Cedis." }] }),
  component: Pricing,
});

function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loadingKeys, setLoadingKeys] = useState<Set<keyof typeof PRICING>>(new Set());

  const buy = async (key: keyof typeof PRICING) => {
    if (!user) { nav({ to: "/login" }); return; }
    if (loadingKeys.has(key)) return;
    setLoadingKeys((prev) => new Set([...prev, key]));
    const p = PRICING[key];
    try {
      const ghsAmount = p.price;
      toast.message(`Opening Paystack checkout for GHS ${ghsAmount.toFixed(2)}`);
      await payWithPaystack({
        email: user.email!,
        amountGhs: ghsAmount,
        metadata: { tier: p.tier, name: p.name },
        onSuccess: async (ref) => {
          const today = new Date().toISOString().slice(0, 10);
          const expiresAt = "premium" === key
            ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
            : new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          const { error } = await supabase.from("purchases").insert({
            user_id: user.id, tier: p.tier, price: ghsAmount, amount_ghs: ghsAmount,
            reference: ref, match_date: today, expires_at: expiresAt,
          });
          if (error) toast.error(`Purchase failed: ${error.message}`);
          else { 
            toast.success(`Payment successful! Access granted until ${new Date(expiresAt).toLocaleString()}`); 
            nav({ to: "/dashboard" }); 
          }
        },
        onClose: () => toast.info("Payment cancelled. You can try again anytime."),
      });
    } catch (error) {
      toast.error("Failed to get exchange rate. Please refresh and try again.");
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Pricing</h1>
          <p className="mt-3 text-muted-foreground">Pay-per-tip in USD. Auto-converted to GHS for Paystack. Pay once, win smart.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Object.entries(PRICING).map(([k, p]) => (
            <Card key={k} className={`flex flex-col p-6 ${k === "premium" ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-[var(--shadow-elegant)]" : ""}`}>
              {k === "premium" && <span className="mb-2 self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">PREMIUM</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 text-4xl font-extrabold">${p.price}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Fixed Match</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant unlock</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {k === "premium" ? "3 picks in a row" : "24-hour access"}</li>
              </ul>
<Button className="mt-6" onClick={() => buy(k as keyof typeof PRICING)} disabled={loadingKeys.has(k as keyof typeof PRICING)}>{loadingKeys.has(k as keyof typeof PRICING) ? "Converting..." : "Buy with Paystack"}</Button>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">Not signed in? <Link to="/signup" className="text-primary hover:underline">Create account</Link></p>
      </section>
    </SiteLayout>
  );
}
