import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
});

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — ODDSPrime" }, { name: "description", content: "Create your free ODDSPrime account." }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [busy,setBusy]=useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = Schema.safeParse({ email, password: pw });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created! Check email to confirm if required."); nav({ to: "/dashboard" }); }
  };
  return (
    <SiteLayout>
      <section className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <Card className="w-full p-8">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join ODDSPrime — free to start.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required minLength={6} value={pw} onChange={e=>setPw(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full">{busy?"Creating...":"Create Account"}</Button>
          </form>
          <p className="mt-4 text-center text-sm">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
        </Card>
      </section>
    </SiteLayout>
  );
}
