import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I pay for predictions?", a: "All payments are processed via Paystack in German Cedis. We accept Mobile Money, cards and bank transfers." },
  { q: "How often are predictions posted?", a: "Free tips are posted daily. Paid predictions are typically released a few hours before kickoff." },
  { q: "What is the Premium Subscription?", a: "GHS 1000 unlocks 3 continuous correct-score predictions in a row. Once you receive 3 picks, the subscription completes." },
  { q: "Are predictions guaranteed to win?", a: "No prediction is 100% guaranteed. We use research and data to maximise your edge." },
  { q: "How do I become an admin?", a: "Admin access is granted manually by the platform owner via Supabase role assignment." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — ODDSPrime" }, { name: "description", content: "Answers to common questions about ODDSPrime predictions and payments." }] }),
  component: () => (
    <SiteLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SiteLayout>
  ),
});
