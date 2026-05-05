import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — ODDSPrime" }, { name: "description", content: "Reset your ODDSPrime password." }] }),
  component: Fp,
});
function Fp() {
  const [email,setEmail]=useState(""); const [busy,setBusy]=useState(false);
  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Reset email sent.");
  };
  return (
    <SiteLayout>
      <section className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <Card className="w-full p-8">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <Button disabled={busy} className="w-full">{busy?"Sending...":"Send reset link"}</Button>
          </form>
          <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary hover:underline">Back to login</Link></p>
        </Card>
      </section>
    </SiteLayout>
  );
}
