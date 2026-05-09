import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface Prediction {
  id: string; match_date: string; kickoff?: string | null; league?: string | null;
  home_team: string; away_team: string; prediction: string;
  odds?: number | null; tier: string; status: string; is_locked?: boolean | null; sportybet_code?: string | null; betway_code?: string | null; mybet_code?: string | null;
}

interface ComboMatch {
  matchId: string;
  home_team: string;
  away_team: string;
  league: string;
  matchTime: string;
  prediction?: string;
  odds?: number;
  status: "pending" | "won" | "lost" | "void";
}

export function PredictionCard({
  p,
  locked = false,
  tierPrice,
  onUnlock,
  unlockLoading = false,
}: {
  p: Prediction;
  locked?: boolean;
  tierPrice?: number;
  onUnlock?: (tier: string) => void;
  unlockLoading?: boolean;
}) {
  const [bookmaker, setBookmaker] = useState<"sportybet" | "betway" | "mybet">("sportybet");
  const status = (p.status || "pending").toLowerCase();
  const statusColor = status === "won" ? "bg-green-500/15 text-green-600" : status === "lost" ? "bg-destructive/15 text-destructive" : status === "void" ? "bg-blue-500/15 text-blue-600" : "bg-muted text-muted-foreground";
  let comboMatches: ComboMatch[] = [];
  if (p.tier === "combo") {
    try {
      const parsed = JSON.parse(p.prediction || "{}");
      comboMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    } catch {}
  }
  const bookmakerCode = bookmaker === "sportybet" ? p.sportybet_code : bookmaker === "betway" ? p.betway_code : p.mybet_code;
  const isLocked = p.tier === "free" ? false : locked;

  const displayTip = (() => {
    const rawPrediction = (p.prediction || "").trim();

    const parseTipFromJson = (value: string) => {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed?.tip === "string" && parsed.tip.trim()) return parsed.tip;
        if (typeof parsed?.prediction === "string" && parsed.prediction.trim()) return parsed.prediction;
        if (typeof parsed?.selection === "string" && parsed.selection.trim()) return parsed.selection;
      } catch {}
      return null;
    };

    if (p.tier !== "combo") {
      const parsedTip = parseTipFromJson(rawPrediction);
      if (parsedTip) return parsedTip;
      return rawPrediction;
    }

    const parsedTip = parseTipFromJson(rawPrediction);
    if (parsedTip) return parsedTip;
    if (comboMatches.length > 0) return `${comboMatches.length}-Match Combo`;

    return "Combo matches listed below";
  })();
  const cardTitle = p.tier === "combo"
    ? `${comboMatches.length || "Multi"}-Match Combo Ticket`
    : `${p.home_team} vs ${p.away_team}`;
  return (
    <Card className="overflow-hidden border-2 p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{p.league || "Football"}</Badge>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>{status.toUpperCase()}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.match_date}</span>
        {p.kickoff && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.kickoff.slice(0,5)}</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold">{cardTitle}</h3>
      {p.tier === "combo" && comboMatches.length > 0 && (
        <div className="mt-3 space-y-2">
          {comboMatches.map((m) => {
            const mStatusColor = m.status === "won" ? "bg-green-500/15 text-green-600" : m.status === "lost" ? "bg-destructive/15 text-destructive" : m.status === "void" ? "bg-blue-500/15 text-blue-600" : "bg-muted text-muted-foreground";
            return (
              <div key={m.matchId} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{m.league}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mStatusColor}`}>{m.status.toUpperCase()}</span>
                </div>
                <div className="text-muted-foreground">{m.matchTime}</div>
                <div>{m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}</div>
                {!isLocked && m.prediction && <div className="text-primary font-semibold">Tip: {m.prediction}</div>}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Tip</div>
        {isLocked ? (
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" /> <span>LOCKED</span>
          </div>
        ) : (
          <div className="mt-1 text-base font-bold text-primary">{displayTip}</div>
        )}
      </div>
      {p.tier !== "free" && (
        <div className="mt-3 rounded-lg border bg-primary/5 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Payment Tier</div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Unlock this prediction</p>
            <span className="text-base font-black text-primary">GH₵{(tierPrice ?? 0).toFixed(2)}</span>
          </div>
          <Button className="mt-3 w-full" onClick={() => onUnlock?.(p.tier)} disabled={!onUnlock || !isLocked || unlockLoading}>
            {isLocked ? (unlockLoading ? "Opening checkout..." : "Unlocked") : "Already unlocked"}
          </Button>
        </div>
      )}
{!isLocked && p.odds && <div className="mt-3 text-sm">Odds: <span className="font-bold">{p.odds}</span></div>}
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => setBookmaker("sportybet")} className={`rounded-md border px-2 py-1 text-xs font-semibold ${bookmaker === "sportybet" ? "border-[#D90429] bg-[#D90429] text-white" : "border-border bg-white"}`}>
            <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-white text-[10px] font-black italic text-[#D90429]">S</span>
            <span className="font-black tracking-tight italic">SportyBet</span>
          </button>
          <button type="button" onClick={() => setBookmaker("betway")} className={`rounded-md border px-2 py-1 text-xs font-semibold ${bookmaker === "betway" ? "border-black bg-black text-white" : "border-border bg-white"}`}>
            <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#7CFC00] text-[10px] font-black text-[#7CFC00]">b</span>
            <span className={`font-black tracking-tight ${bookmaker === "betway" ? "text-[#7CFC00]" : "text-black"}`}>betway</span>
          </button>
          <button type="button" onClick={() => setBookmaker("mybet")} className={`rounded-md border px-2 py-1 text-xs font-semibold ${bookmaker === "mybet" ? "border-[#0F2C8A] bg-[#0F2C8A] text-white" : "border-border bg-white"}`}>
            <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-[#FFD54A] text-[10px] font-black text-[#0F2C8A]">M</span>
            <span className="font-extrabold tracking-tight"><span className={bookmaker === "mybet" ? "text-[#FFD54A]" : "text-[#0F2C8A]"}>my</span><span className={bookmaker === "mybet" ? "text-white" : "text-[#0F2C8A]"}>bet</span></span>
          </button>
        </div>
        <div className="rounded-md border p-2 text-sm">
          <span className="text-muted-foreground">Bet Code: </span>
          <span className="font-semibold">{isLocked ? "LOCKED" : (bookmakerCode || "No code available")}</span>
        </div>
      </div>
    </Card>
  );
}
