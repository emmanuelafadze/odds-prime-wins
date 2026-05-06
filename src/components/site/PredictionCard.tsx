import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Lock } from "lucide-react";

export interface Prediction {
  id: string; match_date: string; kickoff?: string | null; league?: string | null;
  home_team: string; away_team: string; prediction: string;
  odds?: number | null; tier: string; status: string;
}

export function PredictionCard({ p, locked = false }: { p: Prediction; locked?: boolean }) {
  const status = (p.status || "pending").toLowerCase();
  const statusColor = status === "won" ? "bg-green-500/15 text-green-600" : status === "lost" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  const isLocked = locked || status === "pending";
  return (
    <Card className="overflow-hidden p-5 transition hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">{p.league || "Football"}</Badge>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>{status.toUpperCase()}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.match_date}</span>
        {p.kickoff && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.kickoff.slice(0,5)}</span>}
      </div>
      <h3 className="mt-3 text-lg font-bold">{p.home_team} <span className="text-muted-foreground">vs</span> {p.away_team}</h3>
      <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Tip</div>
        {isLocked ? (
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" /> <span>LOCKED</span>
          </div>
        ) : (
          <div className="mt-1 text-base font-bold text-primary">{p.prediction}</div>
        )}
      </div>
{!isLocked && p.odds && <div className="mt-3 text-sm">Odds: <span className="font-bold">{p.odds}</span></div>}
    </Card>
  );
}
