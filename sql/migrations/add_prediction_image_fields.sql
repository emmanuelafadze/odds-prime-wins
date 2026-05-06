-- Store up to 3 uploaded prediction image paths (from Supabase Storage)
ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS prediction_image_1 text,
ADD COLUMN IF NOT EXISTS prediction_image_2 text,
ADD COLUMN IF NOT EXISTS prediction_image_3 text;

-- Ensure storage bucket exists for admin image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('prediction-images', 'prediction-images', false)
ON CONFLICT (id) DO NOTHING;

-- Optional consistency rule by tier
ALTER TABLE public.predictions
DROP CONSTRAINT IF EXISTS predictions_tier_content_check;

ALTER TABLE public.predictions
ADD CONSTRAINT predictions_tier_content_check CHECK (
  (tier IN ('single','combo'))
  OR
  (COALESCE(prediction_image_1,'') <> '' OR COALESCE(prediction_image_2,'') <> '' OR COALESCE(prediction_image_3,'') <> '')
);
