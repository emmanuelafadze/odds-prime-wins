-- Add admin lock control for prediction tickets
ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.predictions.is_locked IS
'Admin-controlled lock state for a prediction ticket. true = locked, false = unlocked.';
