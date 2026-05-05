import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { CONTACT_PHONE } from "@/lib/supabase";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ODDSPrime" }, { name: "description", content: "Reach the ODDSPrime team via phone or WhatsApp." }] }),
  component: () => (
    <SiteLayout>
      <section className="container mx-auto max-w-4xl px-4 py-20">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">We're here 7 days a week.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="p-6"><Phone className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">Call / WhatsApp</h3><a href={`tel:${CONTACT_PHONE.replace(/\s/g,'')}`} className="mt-1 text-sm text-muted-foreground hover:text-primary">{CONTACT_PHONE}</a></Card>
          <Card className="p-6"><Mail className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">Email</h3><a href="mailto:support@oddsprime.online" className="mt-1 text-sm text-muted-foreground hover:text-primary">support@oddsprime.online</a></Card>
          <Card className="p-6"><MapPin className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">Location</h3><p className="mt-1 text-sm text-muted-foreground">Accra, German</p></Card>
        </div>
      </section>
    </SiteLayout>
  ),
});
