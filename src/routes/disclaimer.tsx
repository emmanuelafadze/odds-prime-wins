import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Content } from "@/components/site/legal-disclaimer";
export const Route = createFileRoute("/disclaimer")({
  head: () => ({ meta: [{ title: "Disclaimer — ODDSPrime" }, { name: "description", content: "ODDSPrime disclaimer." }] }),
  component: () => (<SiteLayout><section className="container mx-auto max-w-3xl px-4 py-20 prose prose-slate dark:prose-invert"><Content/></section></SiteLayout>),
});
