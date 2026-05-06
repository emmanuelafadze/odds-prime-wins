import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PredictionCard, type Prediction } from "@/components/site/PredictionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ODDSPrime" }] }),
  component: Dash,
});

interface Purchase { id: string; tier: string; amount_ghs: number; reference: string; expires_at: string; created_at: string; }

function Dash() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [preds, setPreds] = useState<Prediction[] | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("purchases").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setPurchases((data as Purchase[]) ?? []));
    supabase.from("predictions").select("*").order("match_date", { ascending: false }).limit(50)
      .then(({ data }) => setPreds((data as Prediction[]) ?? []));
  }, [user]);

  if (loading || !user) return <SiteLayout><div className="container mx-auto px-4 py-20"><Skeleton className="h-40" /></div></SiteLayout>;

  const active = (purchases ?? []).filter(p => new Date(p.expires_at) > new Date());
  const tiers = new Set(active.map(p => p.tier));
  if (tiers.has("premium")) ["single","combo","five","ten"].forEach(t=>tiers.add(t));

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
          </div>
          <Link to="/pricing"><Button>Buy Predictions</Button></Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="p-6"><div className="text-sm text-muted-foreground">Active Subscriptions</div><div className="mt-2 text-3xl font-bold">{active.length}</div></Card>
          <Card className="p-6"><div className="text-sm text-muted-foreground">Total Spend (GHS)</div><div className="mt-2 text-3xl font-bold">{(purchases??[]).reduce((s,p)=>s+Number(p.amount_ghs),0).toFixed(2)}</div></Card>
          <Card className="p-6"><div className="text-sm text-muted-foreground">Account</div><div className="mt-2 text-base font-medium">Member</div></Card>
        </div>

        <Tabs defaultValue="picks" className="mt-10">
          <TabsList>
            <TabsTrigger value="picks">My Predictions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="picks" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preds === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-48"/>) :
              preds.length === 0 ? <p className="text-muted-foreground col-span-full">No predictions available.</p> :
              preds.map(p => <PredictionCard key={p.id} p={p} locked={p.tier !== "free" && !tiers.has(p.tier)} />)}
          </TabsContent>

          <TabsContent value="purchases" className="mt-6">
            <Card className="p-6">
              {purchases === null ? <Skeleton className="h-24" /> :
                purchases.length === 0 ? <p className="text-muted-foreground">No purchases yet.</p> :
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Date</th><th>Tier</th><th>Amount</th><th>Reference</th><th>Expires</th></tr></thead>
                  <tbody>{purchases.map(p=>(<tr key={p.id} className="border-b"><td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td><td className="capitalize">{p.tier}</td><td>GHS {Number(p.amount_ghs).toFixed(2)}</td><td className="font-mono text-xs">{p.reference}</td><td>{new Date(p.expires_at).toLocaleDateString()}</td></tr>))}</tbody>
                </table></div>
              }
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Profile</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Email</dt><dd className="col-span-2">{user.email}</dd></div>
                <div className="grid grid-cols-3"><dt className="text-muted-foreground">User ID</dt><dd className="col-span-2 font-mono text-xs">{user.id}</dd></div>
                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Joined</dt><dd className="col-span-2">{new Date(user.created_at).toLocaleDateString()}</dd></div>
              </dl>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
