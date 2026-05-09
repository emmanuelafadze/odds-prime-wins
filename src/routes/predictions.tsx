import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PredictionCard, type Prediction } from "@/components/site/PredictionCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRICING } from "@/lib/pricing";
import { payWithPaystack } from "@/lib/paystack";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { checkPredictionAccess } from "@/lib/prediction-access";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Premium Predictions — ODDSPrime" }, { name: "description", content: "Premium correct scores and accumulators in German cedis." }] }),
  component: Pred,
});

const TIERS = [
  { key: "single", label: "Single Correct Score" },
  { key: "combo", label: "Combo Correct Score" },
  { key: "fixed_draw", label: "Fixed Draw" },
  { key: "premium", label: "Premium" },
];

function Pred() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Prediction[] | null>(null);
  const [unlockedPredictions, setUnlockedPredictions] = useState<Set<string>>(new Set());
  const [loadingPredictions, setLoadingPredictions] = useState<Set<string>>(new Set());

  const tierPriceMap: Record<string, number> = {
    single: PRICING.single.price,
    combo: PRICING.combo.price,
    fixed_draw: PRICING.fixed_draw.price,
    premium: PRICING.premium.price,
  };

  const buyPrediction = async (prediction: Prediction) => {
    if (!user) { nav({ to: "/login" }); return; }
    if (loadingPredictions.has(prediction.id)) return;
    const pricingEntry = Object.values(PRICING).find((entry) => entry.tier === prediction.tier);
    if (!pricingEntry) return;
    setLoadingPredictions((prev) => new Set(prev).add(prediction.id));
    toast.message(`Opening Paystack checkout for GH₵${pricingEntry.price.toFixed(2)}`);
    await payWithPaystack({
      email: user.email!,
      amountGhs: pricingEntry.price,
      metadata: { tier: pricingEntry.tier, name: pricingEntry.name, predictionId: prediction.id },
      onSuccess: async (ref) => {
        const { error: historyError } = await supabase.from("purchase_history").insert({
          user_id: user.id, prediction_id: prediction.id, tier: pricingEntry.tier, amount_ghs: pricingEntry.price,
          reference: ref, status: "successful",
        });
        const { error: accessError } = await supabase.from("prediction_access").upsert({
          user_id: user.id, prediction_id: prediction.id, source: "purchase", is_active: true,
        }, { onConflict: "user_id,prediction_id,source" });
        if (historyError || accessError) toast.error(`Purchase failed: ${historyError?.message || accessError?.message}`);
        else {
          toast.success("Payment successful! Prediction unlocked.");
          void loadPurchasesAndAccess();
        }
      },
      onClose: () => toast.info("Payment cancelled. You can try again anytime."),
    });
    setLoadingPredictions((prev) => {
      const next = new Set(prev);
      next.delete(prediction.id);
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    const loadPredictions = async () => {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select("*")
          .order("match_date", { ascending: false })
          .limit(100);

        if (error) throw error;
        if (active) setItems((data as Prediction[]) ?? []);
      } catch {
        if (active) setItems([]);
      }
    };

    const loadPurchasesAndAccess = async () => {
      if (!user) {
        if (active) setUnlockedPredictions(new Set());
        return;
      }

      try {
        const rows = (await supabase.from("predictions").select("id")).data ?? [];
        const accessResults = await Promise.all(rows.map(async (row: any) => ({ id: row.id, access: await checkPredictionAccess(user.id, row.id) })));
        const s = new Set<string>(accessResults.filter((r) => r.access.canAccess).map((r) => r.id));
        if (active) setUnlockedPredictions(s);
      } catch {
        if (active) setUnlockedPredictions(new Set());
      }
    };

    loadPredictions();
    loadPurchasesAndAccess();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">All Predictions</h1>
            <p className="mt-2 text-muted-foreground">Browse free tips and unlock premium picks.</p>
          </div>
          {!user && <Link to="/signup"><Button>Sign up to unlock</Button></Link>}
        </div>
        <Tabs defaultValue="all" className="mt-8">
          <TabsList className="flex-wrap"><TabsTrigger value="all">All</TabsTrigger>{TIERS.map(t=><TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}</TabsList>
          {["all", ...TIERS.map(t=>t.key)].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {items === null ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-48"/>))}</div> :
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.filter(p => tab==="all" || p.tier===tab).map(p => {
                    const locked = !unlockedPredictions.has(p.id);
                    return <PredictionCard key={p.id} p={p} locked={locked} tierPrice={tierPriceMap[p.tier]} onUnlock={() => buyPrediction(p)} unlockLoading={loadingPredictions.has(p.id)} />;
                  })}
                  {items.filter(p => tab==="all" || p.tier===tab).length===0 && (
                    <Card className="col-span-full p-8 text-center text-muted-foreground">No predictions in this category yet.</Card>
                  )}
                </div>
              }
            </TabsContent>
          ))}
        </Tabs>
        <div className="mt-10 rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
          <h3 className="text-xl font-bold">Unlock Premium Picks</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pay in GHS via Paystack. Instant access.</p>
          <Link to="/pricing"><Button className="mt-4">View Pricing</Button></Link>
        </div>
      </section>
    </SiteLayout>
  );
}
