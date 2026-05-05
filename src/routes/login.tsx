import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — ODDSPrime" }, { name: "description", content: "Sign in to your ODDSPrime account." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [busy,setBusy]=useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back!"); nav({ to: "/dashboard" }); }
  };
  return (
    <SiteLayout>
      <section className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
        <Card className="w-full p-8">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-14 w-14" />
            <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your ODDSPrime account.</p>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required value={pw} onChange={e=>setPw(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full">{busy?"Signing in...":"Sign In"}</Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            <Link to="/signup" className="text-primary hover:underline">Create account</Link>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
