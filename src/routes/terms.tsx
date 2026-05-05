import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Content } from "@/components/site/legal-terms";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — ODDSPrime" }, { name: "description", content: "ODDSPrime terms." }] }),
  component: () => (<SiteLayout><section className="container mx-auto max-w-3xl px-4 py-20 prose prose-slate dark:prose-invert"><Content/></section></SiteLayout>),
});
