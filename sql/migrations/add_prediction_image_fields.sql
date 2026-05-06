-- Store up to 3 prediction images for non-single/non-combo tiers
ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS prediction_image_1 text,
ADD COLUMN IF NOT EXISTS prediction_image_2 text,
ADD COLUMN IF NOT EXISTS prediction_image_3 text;

-- Optional consistency rule by tier
ALTER TABLE public.predictions
DROP CONSTRAINT IF EXISTS predictions_tier_content_check;

ALTER TABLE public.predictions
ADD CONSTRAINT predictions_tier_content_check CHECK (
  (tier IN ('single','combo'))
  OR
  (COALESCE(prediction_image_1,'') <> '' OR COALESCE(prediction_image_2,'') <> '' OR COALESCE(prediction_image_3,'') <> '')
);
