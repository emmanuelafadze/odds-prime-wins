import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — ODDSPrime" },
    { name: "description", content: "Ghana's premier football prediction platform offering verified daily tips and correct scores." },
    { property: "og:title", content: "About ODDSPrime" },
    { property: "og:description", content: "Why ODDSPrime is Ghana's most trusted tipster." },
  ]}),
  component: () => (
    <SiteLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-bold">About ODDSPrime</h1>
        <p className="mt-6 text-muted-foreground">
          ODDSPrime is Ghana's premium football prediction platform. We combine deep statistical models, expert analysis and live data to deliver tips that actually win.
        </p>
        <p className="mt-4 text-muted-foreground">
          Our slogan — <strong>Prime Odds, Smart Wins</strong> — defines our promise: high-quality picks, transparent pricing, and a community of smart bettors.
        </p>
        <h2 className="mt-10 text-2xl font-bold">Our Mission</h2>
        <p className="mt-3 text-muted-foreground">To bring clarity, discipline and verified information to every Ghanaian punter, all priced fairly in Ghana Cedis.</p>
        <h2 className="mt-10 text-2xl font-bold">What We Offer</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
          <li>Free daily tips for the public</li>
          <li>Premium correct scores and accumulators</li>
          <li>Subscription packages for serial winners</li>
          <li>Secure payments through Paystack</li>
        </ul>
      </section>
    </SiteLayout>
  ),
});
