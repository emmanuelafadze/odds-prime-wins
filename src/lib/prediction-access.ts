import { supabase } from "@/lib/supabase";

export const RESULT_UNLOCK_STATUSES = new Set(["won", "lost", "void"]);

export async function checkPredictionAccess(userId: string | null | undefined, predictionId: string) {
  const { data: prediction, error: predictionError } = await supabase
    .from("predictions")
    .select("id,tier,status,is_locked")
    .eq("id", predictionId)
    .single();

  if (predictionError || !prediction) {
    return { canAccess: false, reason: "prediction_not_found" as const };
  }

  if (RESULT_UNLOCK_STATUSES.has((prediction.status || "").toLowerCase())) {
    return { canAccess: true, reason: "result_finalized" as const };
  }

  if (!userId) return { canAccess: false, reason: "authentication_required" as const };

  const [{ data: purchases }, { data: subscriptions }] = await Promise.all([
    supabase.from("prediction_access").select("id").eq("user_id", userId).eq("prediction_id", predictionId).eq("is_active", true).limit(1),
    supabase.from("user_subscriptions").select("id").eq("user_id", userId).eq("is_active", true).gt("expires_at", new Date().toISOString()).limit(1),
  ]);

  if ((purchases?.length ?? 0) > 0 || (subscriptions?.length ?? 0) > 0) {
    return { canAccess: true, reason: "entitled" as const };
  }

  return { canAccess: false, reason: prediction.is_locked ? "locked" as const : "not_entitled" as const };
}
