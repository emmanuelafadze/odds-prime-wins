import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit, Eye, EyeOff, Plus, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) nav({ to: "/dashboard" });
  }, [loading, user, role, nav]);

  const normalizePredictions = useCallback((rows: Pred[]) => {
    const next = new Map<string, Pred>();
    for (const row of rows) {
      if (!row?.id || deletedIdsRef.current.has(row.id)) continue;
      next.set(row.id, row);
    }
    return Array.from(next.values());
  }, []);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    const [{ data: pData }, { data: pur }] = await Promise.all([
      supabase.from("predictions").select("*").order("match_date",{ascending:false}),
      supabase.from("purchases").select("*").order("created_at",{ascending:false}),
    ]);
    setPreds(normalizePredictions((pData as Pred[]) ?? []));
    setPurchases((pur as Purchase[]) ?? []);
    setIsRefreshing(false);
  }, [normalizePredictions]);
  useEffect(() => { if (role==="admin") void load(); }, [role, load]);

  useEffect(() => {
    if (role !== "admin") return;
    const channel = supabase.channel("admin-predictions-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, () => {
        void load();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [role, load]);

  const renderedPreds = useMemo(() => normalizePredictions(preds ?? []), [preds, normalizePredictions]);

  if (loading || role !== "admin") return <SiteLayout><div className="container mx-auto px-4 py-20"><Skeleton className="h-40"/></div></SiteLayout>;

  // --- Stats ---
  const totalRevenue = (purchases??[]).reduce((s,p)=>s+Number(p.amount_ghs ?? 0),0);
  const uniqueCustomers = new Set((purchases??[]).map(p=>p.user_id).filter(Boolean)).size;
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
    const total = (purchases??[]).filter(p=>(p.created_at || "").slice(0,10)===key).reduce((s,p)=>s+Number(p.amount_ghs ?? 0),0);
    return { day: d.toLocaleDateString(undefined,{weekday:"short"}), revenue: total };
  });

  const save = async (p: Partial<Pred>) => {
    const payload: any = {
      match_date: p.match_date, kickoff: p.kickoff || null, league: p.league || null,
      home_team: p.home_team, away_team: p.away_team, prediction: p.prediction,
      odds: p.odds ? Number(p.odds) : null, tier: p.tier || "free",
      status: p.status || "pending", published: p.published ?? true, is_locked: p.is_locked ?? false, sportybet_code: p.sportybet_code || null, betway_code: p.betway_code || null, mybet_code: p.mybet_code || null,
    };
    const { error } = p.id
      ? await supabase.from("predictions").update(payload).eq("id", p.id).select("id").single()
      : await supabase.from("predictions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setEditing(null); void load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this prediction?")) return;
    deletedIdsRef.current.add(id);
    setPreds(prev => (prev ?? []).filter(p => p.id !== id));
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) {
      deletedIdsRef.current.delete(id);
      toast.error(error.message);
      void load();
      return;
    }
    toast.success("Deleted");
    void load();
  };
  const togglePub = async (p: Pred) => {
    await supabase.from("predictions").update({ published: !p.published }).eq("id", p.id);
    void load();
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
                  {renderedPreds.map(p=>(
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-2">{p.match_date}</td>
                      <td>{p.home_team} vs {p.away_team}</td>
                      <td>{getDisplayPrediction(p.prediction)}</td>
                      <td className="capitalize">{p.tier}</td>
                      <td>{p.odds ?? "-"}</td>
                      <td className="capitalize">{p.status}</td>
                      <td>{p.published ? "✓" : "—"}</td>
                      <td>{p.is_locked ? "🔒" : "🔓"}</td>
                      <td className="space-x-1 px-2 py-2">
                        <Button size="icon" variant="ghost" onClick={()=>togglePub(p)} title="Toggle publish">{p.published?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</Button>
                                                <Button size="icon" variant="ghost" onClick={()=>setEditing(p)}><Edit className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </td>
                    </tr>
                  ))}
                  {renderedPreds.length===0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{isRefreshing ? "Refreshing..." : "No predictions yet."}</td></tr>}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="mt-6">
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left"><tr><th className="px-4 py-3">Date</th><th>User</th><th>Tier</th><th>Amount</th></tr></thead>
                <tbody>
                  {(purchases??[]).map(p=>(<tr key={p.id} className="border-b"><td className="px-4 py-2">{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td><td className="font-mono text-xs">{p.user_id ? `${p.user_id.slice(0,8)}…` : "-"}</td><td className="capitalize">{p.tier || "-"}</td><td>GHS {Number(p.amount_ghs ?? 0).toFixed(2)}</td></tr>))}
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

interface MatchType { matchId: string; home_team: string; away_team: string; league: string; matchTime: string; odds?: number; prediction: string; status: "pending" | "won" | "lost" | "void"; }

function getDisplayPrediction(prediction: string) {
  const raw = (prediction || "").trim();
  if (!raw) return "-";

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.tip === "string" && parsed.tip.trim()) return parsed.tip;
    if (typeof parsed?.prediction === "string" && parsed.prediction.trim()) return parsed.prediction;
    if (typeof parsed?.selection === "string" && parsed.selection.trim()) return parsed.selection;
    if (Array.isArray(parsed?.matches) && parsed.matches.length > 0) return `${parsed.matches.length}-Match Combo`;
  } catch {
    return raw;
  }

  return raw;
}

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
              {["pending", "won", "lost", "void"].map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function EditDialog({ initial, onClose, onSave }: { initial: Partial<Pred>; onClose: () => void; onSave: (data: Partial<Pred>) => Promise<void> }) {
  const [global, setGlobal] = useState({ match_date: initial.match_date || new Date().toISOString().slice(0,10), kickoff: initial.kickoff || '', league: initial.league || '', tier: initial.tier || 'free', status: initial.status || 'pending', published: initial.published ?? true, is_locked: (initial.status || "pending") === "pending" });
  const [codes, setCodes] = useState({ sportybet_code: initial.sportybet_code || "", betway_code: initial.betway_code || "", mybet_code: initial.mybet_code || "" });
  const [images, setImages] = useState({ prediction_image_1: initial.prediction_image_1 || "", prediction_image_2: initial.prediction_image_2 || "", prediction_image_3: initial.prediction_image_3 || "" });
  const [imageFiles, setImageFiles] = useState<{ prediction_image_1?: File; prediction_image_2?: File; prediction_image_3?: File }>({});
  const initialTier = initial.tier || "single";
  const initialCount = initialTier === "single" ? 1 : initialTier === "combo" ? 2 : (tierMap[initialTier as keyof typeof tierMap] || 1);
  const [matches, setMatches] = useState<MatchType[]>(() => {
    const base = initial.home_team ? [{ matchId: crypto.randomUUID(), home_team: initial.home_team, away_team: initial.away_team || "", league: initial.league || "", matchTime: initial.kickoff || "", odds: initial.odds, prediction: initial.prediction || "", status: (initial.status as MatchType["status"]) || "pending" }] : [];
    while (base.length < initialCount) base.push({ matchId: crypto.randomUUID(), home_team: "", away_team: "", league: "", matchTime: "", prediction: "", status: "pending" });
    return base.slice(0, initialCount);
  });

  const updateGlobal = (updates: Partial<typeof global>) => setGlobal(g => ({ ...g, ...updates, is_locked: ((updates.status ?? g.status) === "pending") }));
  const updateMatch = (index: number, updates: Partial<MatchType>) => setMatches(m => m.map((match, i) => i === index ? { ...match, ...updates } : match));
  
  const handleTierChange = (tier: string) => {
    updateGlobal({ tier });
    const count = tier === "single" ? 1 : tier === "combo" ? 2 : (tierMap[tier as keyof typeof tierMap] || 1);
    setMatches(Array.from({ length: count }, () => ({ matchId: crypto.randomUUID(), home_team: '', away_team: '', league: '', matchTime: '', prediction: '', status: "pending" })));
  };

  const uploadImageIfNeeded = async (field: "prediction_image_1" | "prediction_image_2" | "prediction_image_3") => {
    const file = imageFiles[field];
    if (!file) return images[field];
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `predictions/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("prediction-images").upload(filePath, file, { upsert: false });
    if (error) throw new Error(error.message);
    return filePath;
  };

  const save = async () => {
    let uploadedImages = { ...images };
    try {
      uploadedImages = {
        prediction_image_1: await uploadImageIfNeeded("prediction_image_1") || "",
        prediction_image_2: await uploadImageIfNeeded("prediction_image_2") || "",
        prediction_image_3: await uploadImageIfNeeded("prediction_image_3") || "",
      };
    } catch (e: any) {
      return toast.error(`Image upload failed: ${e.message}`);
    }

    if (!["single", "combo"].includes(global.tier)) {
      const payload: Partial<Pred> = {
        id: initial.id,
        match_date: global.match_date,
        kickoff: null,
        league: global.league || "Image Ticket",
        home_team: global.league || "Image",
        away_team: "Ticket",
        prediction: "IMAGE_TICKET",
        odds: null,
        tier: global.tier,
        status: global.status,
        published: global.published,
        is_locked: (match.status || global.status) === "pending",
        sportybet_code: codes.sportybet_code || null,
        betway_code: codes.betway_code || null,
        mybet_code: codes.mybet_code || null,
        prediction_image_1: uploadedImages.prediction_image_1 || null,
        prediction_image_2: uploadedImages.prediction_image_2 || null,
        prediction_image_3: uploadedImages.prediction_image_3 || null,
      };
      await onSave(payload);
      return;
    }

    if (global.tier === "combo") {
      const comboStatus = matches.some(m => m.status === "lost") ? "lost" : matches.every(m => ["won", "void"].includes(m.status)) ? "won" : "pending";
      const payload: Partial<Pred> = {
        id: initial.id,
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
        is_locked: comboStatus === "pending",
        sportybet_code: codes.sportybet_code || null,
        betway_code: codes.betway_code || null,
        mybet_code: codes.mybet_code || null,
        prediction_image_1: uploadedImages.prediction_image_1 || null,
        prediction_image_2: uploadedImages.prediction_image_2 || null,
        prediction_image_3: uploadedImages.prediction_image_3 || null,
      };
      await onSave(payload);
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
        is_locked: (match.status || global.status) === "pending",
        sportybet_code: codes.sportybet_code || null,
        betway_code: codes.betway_code || null,
        mybet_code: codes.mybet_code || null,
        prediction_image_1: uploadedImages.prediction_image_1 || null,
        prediction_image_2: uploadedImages.prediction_image_2 || null,
        prediction_image_3: uploadedImages.prediction_image_3 || null,
      };
      await onSave({ id: initial.id, ...payload });
      break;
    }
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
              <Input value={global.status === "pending" ? "LOCKED (AUTO)" : "OPEN (AUTO)"} disabled />
            </div>
          </div>
        </div>

        {/* Dynamic Match Blocks */}
        {["single", "combo"].includes(global.tier) && (
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
        )}
        {!(["single", "combo"] as const).includes(global.tier as "single"|"combo") && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Upload Prediction Image 1</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFiles(i => ({ ...i, prediction_image_1: e.target.files?.[0] }))} />
            </div>
            <div>
              <Label>Upload Prediction Image 2</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFiles(i => ({ ...i, prediction_image_2: e.target.files?.[0] }))} />
            </div>
            <div>
              <Label>Upload Prediction Image 3</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFiles(i => ({ ...i, prediction_image_3: e.target.files?.[0] }))} />
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
