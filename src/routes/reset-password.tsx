import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set New Password — ODDSPrime" }] }),
  component: Rp,
});
function Rp() {
  const nav = useNavigate();
  const [pw,setPw]=useState(""); const [busy,setBusy]=useState(false);
  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Password updated"); nav({ to: "/dashboard" }); }
  };
  return (
    <SiteLayout>
      <section className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <Card className="w-full p-8">
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="p">New Password</Label><Input id="p" type="password" required minLength={6} value={pw} onChange={e=>setPw(e.target.value)} /></div>
            <Button disabled={busy} className="w-full">{busy?"Updating...":"Update Password"}</Button>
          </form>
        </Card>
      </section>
    </SiteLayout>
  );
}
