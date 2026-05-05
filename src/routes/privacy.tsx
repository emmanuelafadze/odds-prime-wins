import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Content } from "@/components/site/legal-privacy";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy — ODDSPrime" }, { name: "description", content: "ODDSPrime privacy." }] }),
  component: () => (<SiteLayout><section className="container mx-auto max-w-3xl px-4 py-20 prose prose-slate dark:prose-invert"><Content/></section></SiteLayout>),
});
