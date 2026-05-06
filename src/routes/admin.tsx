import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit, Eye, EyeOff, Plus, TrendingUp, Users, DollarSign, Activity, Lock, Unlock } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ODDSPrime" }] }),
  component: Admin,
});

const TIERS = ["free","single","combo","five","ten","premium"] as const;
const COLORS = ["#f5b800","#3b82f6","#10b981","#ef4444","#8b5cf6","#f97316"];

interface Pred { id:string; match_date:string; kickoff?:string|null; league?:string|null; home_team:string; away_team:string; prediction:string; odds?:number|null; tier:string; status:string; published:boolean; is_locked?: boolean | null; prediction_image_1?: string | null; prediction_image_2?: string | null; prediction_image_3?: string | null; sportybet_code?: string | null; betway_code?: string | null; mybet_code?: string | null; }
interface Purchase { id:string; user_id:string; tier:string; amount_ghs:number; created_at:string; }

function Admin() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [preds, setPreds] = useState<Pred[]|null>(null);
  const [purchases, setPurchases] = useState<Purchase[]|null>(null);
  const [editing, setEditing] = useState<Partial<Pred>|null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

  const load = async () => {
    const [{ data: pData }, { data: pur }] = await Promise.all([
      supabase.from("predictions").select("*").order("match_date",{ascending:false}),
      supabase.from("purchases").select("*").order("created_at",{ascending:false}),
    ]);
    setPreds((pData as Pred[]) ?? []);
    setPurchases((pur as Purchase[]) ?? []);
  };
  useEffect(() => { if (role==="admin") load(); }, [role]);

  if (loading || role !== "admin") return <SiteLayout><div className="container mx-auto px-4 py-20"><Skeleton className="h-40"/></div></SiteLayout>;

  // --- Stats ---
  const totalRevenue = (purchases??[]).reduce((s,p)=>s+Number(p.amount_ghs),0);
  const uniqueCustomers = new Set((purchases??[]).map(p=>p.user_id)).size;
  const wonCount = (preds??[]).filter(p=>p.status==="won").length;
  const totalPreds = (preds??[]).length;
  const winRate = totalPreds ? Math.round((wonCount/totalPreds)*100) : 0;

  // pie: revenue per tier
  const pieData = TIERS.map(t => ({
    name: t, value: (purchases??[]).filter(p=>p.tier===t).reduce((s,p)=>s+Number(p.amount_ghs),0),
  })).filter(d => d.value > 0);

  // bar: customers per tier
  const barData = TIERS.map(t => ({
    name: t,
    customers: new Set((purchases??[]).filter(p=>p.tier===t).map(p=>p.user_id)).size,
    sales: (purchases??[]).filter(p=>p.tier===t).length,
  }));

  // line: revenue last 7 days
  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const key = d.toISOString().slice(0,10);
    const total = (purchases??[]).filter(p=>p.created_at.slice(0,10)===key).reduce((s,p)=>s+Number(p.amount_ghs),0);
    return { day: d.toLocaleDateString(undefined,{weekday:"short"}), revenue: total };
  });

  const save = async (p: Partial<Pred>) => {
    const payload: any = {
      match_date: p.match_date, kickoff: p.kickoff || null, league: p.league || null,
      home_team: p.home_team, away_team: p.away_team, prediction: p.prediction,
      odds: p.odds ? Number(p.odds) : null, tier: p.tier || "free",
      status: p.status || "pending", published: p.published ?? true, is_locked: p.is_locked ?? false, sportybet_code: p.sportybet_code || null, betway_code: p.betway_code || null, mybet_code: p.mybet_code || null,
    };
    if (!payload.match_date || !payload.home_team || !payload.away_team || !payload.prediction) return toast.error("Missing required fields");
    const { error } = p.id
      ? await supabase.from("predictions").update(payload).eq("id", p.id)
      : await supabase.from("predictions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this prediction?")) return;
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const togglePub = async (p: Pred) => {
    await supabase.from("predictions").update({ published: !p.published }).eq("id", p.id);
    load();
  };

  const toggleLock = async (p: Pred) => {
    await supabase.from("predictions").update({ is_locked: !p.is_locked }).eq("id", p.id);
    toast.success(!p.is_locked ? "Ticket locked" : "Ticket unlocked");
    load();
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={()=>setEditing({ match_date: new Date().toISOString().slice(0,10), tier: "free", status: "pending", published: true })}><Plus className="mr-2 h-4 w-4"/>New Prediction</Button>
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Kpi icon={DollarSign} label="Total Revenue" value={`GHS ${totalRevenue.toFixed(2)}`} />
          <Kpi icon={Users} label="Customers" value={String(uniqueCustomers)} />
          <Kpi icon={Activity} label="Predictions" value={String(totalPreds)} />
          <Kpi icon={TrendingUp} label="Win Rate" value={`${winRate}%`} />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold">Sales by Tier (GHS)</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData.length?pieData:[{name:"none",value:1}]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold">Active Customers per Tier</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customers" fill="#3b82f6" radius={[6,6,0,0]} />
                  <Bar dataKey="sales" fill="#f5b800" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-3">
            <h3 className="text-sm font-semibold">Revenue — Last 7 Days</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#f5b800" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="preds" className="mt-8">
          <TabsList><TabsTrigger value="preds">Predictions</TabsTrigger><TabsTrigger value="purchases">Purchases</TabsTrigger></TabsList>

          <TabsContent value="preds" className="mt-6">
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left"><tr>
                  <th className="px-4 py-3">Date</th><th>Match</th><th>Tip</th><th>Tier</th><th>Odds</th><th>Status</th><th>Pub</th><th>Lock</th><th></th>
                </tr></thead>
                <tbody>
                  {(preds??[]).map(p=>(
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-2">{p.match_date}</td>
                      <td>{p.home_team} vs {p.away_team}</td>
                      <td>{p.prediction}</td>
                      <td className="capitalize">{p.tier}</td>
                      <td>{p.odds ?? "-"}</td>
                      <td className="capitalize">{p.status}</td>
                      <td>{p.published ? "✓" : "—"}</td>
                      <td>{p.is_locked ? "🔒" : "🔓"}</td>
                      <td className="space-x-1 px-2 py-2">
                        <Button size="icon" variant="ghost" onClick={()=>togglePub(p)} title="Toggle publish">{p.published?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</Button>
                        <Button size="icon" variant="ghost" onClick={()=>toggleLock(p)} title={p.is_locked ? "Unlock ticket" : "Lock ticket"}>{p.is_locked?<Unlock className="h-4 w-4"/>:<Lock className="h-4 w-4"/>}</Button>
                        <Button size="icon" variant="ghost" onClick={()=>setEditing(p)}><Edit className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </td>
                    </tr>
                  ))}
                  {(preds??[]).length===0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No predictions yet.</td></tr>}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="mt-6">
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left"><tr><th className="px-4 py-3">Date</th><th>User</th><th>Tier</th><th>Amount</th></tr></thead>
                <tbody>
                  {(purchases??[]).map(p=>(<tr key={p.id} className="border-b"><td className="px-4 py-2">{new Date(p.created_at).toLocaleString()}</td><td className="font-mono text-xs">{p.user_id.slice(0,8)}…</td><td className="capitalize">{p.tier}</td><td>GHS {Number(p.amount_ghs).toFixed(2)}</td></tr>))}
                  {(purchases??[]).length===0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No purchases yet.</td></tr>}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {editing && <EditDialog initial={editing} onClose={()=>setEditing(null)} onSave={save} />}
    </SiteLayout>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5"/></div>
      </div>
    </Card>
  );
}

interface MatchType { matchId: string; home_team: string; away_team: string; league: string; matchTime: string; odds?: number; prediction: string; status: "pending" | "won" | "lost"; }

const tierMap = {
  single: 1,
  combo: 2,
  five: 5,
  seven: 7,
  ten: 10,
} as Record<string, number>;

function MatchBlock({ index, match, onUpdate }: { index: number; match: MatchType; onUpdate: (updates: Partial<MatchType>) => void }) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <h4 className="font-semibold mb-2">Match {index + 1}</h4>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Home Team</Label>
          <Input value={match.home_team} onChange={e => onUpdate({ home_team: e.target.value })} />
        </div>
        <div>
          <Label>Away Team</Label>
          <Input value={match.away_team} onChange={e => onUpdate({ away_team: e.target.value })} />
        </div>
        <div>
          <Label>League</Label>
          <Input value={match.league} onChange={e => onUpdate({ league: e.target.value })} />
        </div>
        <div>
          <Label>Match Time</Label>
          <Input type="time" value={match.matchTime} onChange={e => onUpdate({ matchTime: e.target.value })} />
        </div>
        <div>
          <Label>Odds (optional)</Label>
          <Input type="number" step="0.01" value={match.odds ?? ''} onChange={e => onUpdate({ odds: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <Label>Tip / Prediction</Label>
          <Input value={match.prediction} onChange={e => onUpdate({ prediction: e.target.value })} placeholder="e.g. Correct Score 2-1" />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={match.status} onValueChange={v => onUpdate({ status: v as MatchType["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pending", "won", "lost"].map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function EditDialog({ initial, onClose }: { initial: Partial<Pred>; onClose: () => void }) {
  const [global, setGlobal] = useState({ match_date: initial.match_date || new Date().toISOString().slice(0,10), kickoff: initial.kickoff || '', league: initial.league || '', tier: initial.tier || 'free', status: initial.status || 'pending', published: initial.published ?? true, is_locked: initial.is_locked ?? false });
  const [codes, setCodes] = useState({ sportybet_code: initial.sportybet_code || "", betway_code: initial.betway_code || "", mybet_code: initial.mybet_code || "" });
  const [images, setImages] = useState({ prediction_image_1: initial.prediction_image_1 || "", prediction_image_2: initial.prediction_image_2 || "", prediction_image_3: initial.prediction_image_3 || "" });
  const initialTier = initial.tier || "single";
  const initialCount = initialTier === "single" ? 1 : initialTier === "combo" ? 2 : (tierMap[initialTier as keyof typeof tierMap] || 1);
  const [matches, setMatches] = useState<MatchType[]>(() => {
    const base = initial.home_team ? [{ matchId: crypto.randomUUID(), home_team: initial.home_team, away_team: initial.away_team || "", league: initial.league || "", matchTime: initial.kickoff || "", odds: initial.odds, prediction: initial.prediction || "", status: (initial.status as MatchType["status"]) || "pending" }] : [];
    while (base.length < initialCount) base.push({ matchId: crypto.randomUUID(), home_team: "", away_team: "", league: "", matchTime: "", prediction: "", status: "pending" });
    return base.slice(0, initialCount);
  });
  
  const updateGlobal = (updates: Partial<typeof global>) => setGlobal(g => ({ ...g, ...updates }));
  const updateMatch = (index: number, updates: Partial<MatchType>) => setMatches(m => m.map((match, i) => i === index ? { ...match, ...updates } : match));
  
  const handleTierChange = (tier: string) => {
    updateGlobal({ tier });
    const count = tier === "single" ? 1 : tier === "combo" ? 2 : (tierMap[tier as keyof typeof tierMap] || 1);
    setMatches(Array.from({ length: count }, () => ({ matchId: crypto.randomUUID(), home_team: '', away_team: '', league: '', matchTime: '', prediction: '', status: "pending" })));
  };

  const validate = () => {
    if (!global.match_date) return 'Date required';
    if (matches.some(m => !m.home_team || !m.away_team || !m.league || !m.matchTime || !m.prediction)) return 'All matches must have Team A, Team B, League, Match Time, and Tip/Prediction';
    const useImages = !['single','combo'].includes(global.tier);
    if (useImages && !images.prediction_image_1 && !images.prediction_image_2 && !images.prediction_image_3) return 'Upload at least one prediction image for this tier';
    return '';
  };

  const save = async () => {
    const error = validate();
    if (error) return toast.error(error);

    if (global.tier === "combo") {
      const comboStatus = matches.some(m => m.status === "lost") ? "lost" : matches.every(m => m.status === "won") ? "won" : "pending";
      const payload = {
        match_date: global.match_date,
        kickoff: null,
        league: "Combo",
        home_team: matches[0]?.home_team || "Combo",
        away_team: matches[0]?.away_team || "Ticket",
        prediction: JSON.stringify({ comboId: initial.id || crypto.randomUUID(), matches }),
        odds: null,
        tier: global.tier,
        status: comboStatus,
        published: global.published,
        is_locked: global.is_locked,
        sportybet_code: codes.sportybet_code || null,
        betway_code: codes.betway_code || null,
        mybet_code: codes.mybet_code || null,
        prediction_image_1: images.prediction_image_1 || null,
        prediction_image_2: images.prediction_image_2 || null,
        prediction_image_3: images.prediction_image_3 || null,
      };
      const { error: insertError } = await supabase.from('predictions').insert(payload);
      if (insertError) return toast.error(insertError.message);
      toast.success("Combo saved!");
      onClose();
      return;
    }
    for (const match of matches) {
      const payload = {
        match_date: global.match_date,
        kickoff: match.matchTime || global.kickoff || null,
        league: match.league || global.league,
        home_team: match.home_team,
        away_team: match.away_team,
        prediction: match.prediction,
        odds: match.odds || null,
        tier: global.tier,
        status: match.status || global.status,
        published: global.published,
        is_locked: global.is_locked,
        sportybet_code: codes.sportybet_code || null,
        betway_code: codes.betway_code || null,
        mybet_code: codes.mybet_code || null,
        prediction_image_1: images.prediction_image_1 || null,
        prediction_image_2: images.prediction_image_2 || null,
        prediction_image_3: images.prediction_image_3 || null,
      };
      const { error: insertError } = await supabase.from('predictions').insert(payload);
      if (insertError) {
        toast.error(`Error saving match ${matches.indexOf(match) + 1}: ${insertError.message}`);
        return;
      }
    }
    toast.success(`${matches.length} prediction(s) saved!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">New Prediction</h3>
        
        {/* Global Fields */}
        <div className="grid gap-4 mb-6 p-4 border rounded-lg">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Match Date</Label>
              <Input type="date" value={global.match_date} onChange={e => updateGlobal({ match_date: e.target.value })} />
            </div>
            <div>
              <Label>Kickoff Time</Label>
              <Input type="time" value={global.kickoff} onChange={e => updateGlobal({ kickoff: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>League</Label>
              <Input value={global.league} onChange={e => updateGlobal({ league: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tier</Label>
              <Select value={global.tier} onValueChange={handleTierChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['single', 'combo', 'five', 'seven', 'ten', 'premium'] as const).map(t => (
                    <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={global.status} onValueChange={v => updateGlobal({ status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['pending', 'won', 'lost', 'void'].map(t => (
                    <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ticket Access</Label>
              <Select value={global.is_locked ? "locked" : "unlocked"} onValueChange={v => updateGlobal({ is_locked: v === "locked" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlocked">UNLOCKED</SelectItem>
                  <SelectItem value="locked">LOCKED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dynamic Match Blocks */}
        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchBlock 
              key={match.matchId}
              index={index}
              match={match}
              onUpdate={updates => updateMatch(index, updates)}
            />
          ))}
          
        </div>
        {!(["single", "combo"] as const).includes(global.tier as "single"|"combo") && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Prediction Image URL 1</Label>
              <Input value={images.prediction_image_1} onChange={e => setImages(i => ({ ...i, prediction_image_1: e.target.value }))} />
            </div>
            <div>
              <Label>Prediction Image URL 2</Label>
              <Input value={images.prediction_image_2} onChange={e => setImages(i => ({ ...i, prediction_image_2: e.target.value }))} />
            </div>
            <div>
              <Label>Prediction Image URL 3</Label>
              <Input value={images.prediction_image_3} onChange={e => setImages(i => ({ ...i, prediction_image_3: e.target.value }))} />
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>SportyBet Code</Label>
            <Input value={codes.sportybet_code} onChange={e => setCodes(c => ({ ...c, sportybet_code: e.target.value }))} />
          </div>
          <div>
            <Label>Betway Code</Label>
            <Input value={codes.betway_code} onChange={e => setCodes(c => ({ ...c, betway_code: e.target.value }))} />
          </div>
          <div>
            <Label>MyBet Code</Label>
            <Input value={codes.mybet_code} onChange={e => setCodes(c => ({ ...c, mybet_code: e.target.value }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save {matches.length > 1 ? `${matches.length} Matches` : 'Match'}</Button>
        </div>
      </Card>
    </div>
  );
}
