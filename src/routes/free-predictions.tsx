import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PredictionCard, type Prediction } from "@/components/site/PredictionCard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/free-predictions")({
  head: () => ({ meta: [{ title: "Free Predictions — ODDSPrime" }, { name: "description", content: "Daily free football tips for German." }] }),
  component: Free,
});

function Free() {
  const [items, setItems] = useState<Prediction[] | null>(null);
  useEffect(() => {
    supabase.from("predictions").select("*").eq("tier", "free").eq("published", true).order("match_date", { ascending: false }).limit(50)
      .then(({ data }) => setItems((data as Prediction[]) ?? []));
  }, []);
  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold">Free Predictions</h1>
        <p className="mt-2 text-muted-foreground">Today's complimentary tips, on the house.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items === null ? Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-48"/>)) :
            items.length === 0 ? <p className="text-muted-foreground">No free predictions yet. Check back soon.</p> :
            items.map(p => <PredictionCard key={p.id} p={p} />)}
        </div>
      </section>
    </SiteLayout>
  );
}
