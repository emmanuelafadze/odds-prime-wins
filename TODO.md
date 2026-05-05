# Task: Complete!

## Steps:
- [x] 1. Pricing.ts USD prices.
- [x] 2. Pricing page $ display + converter integration.
- [x] 3. Paystack.ts USD->GHS converter with API/fallback.
- [x] 4. Index.tsx pricing preview $.
- [x] 5. PredictionCard "Fixed Match Tip".
- [x] 6. Admin form: Dynamic multi-match blocks by tier (1/2/5/7/10), global fields, validation, multi-save to Supabase.
- [x] 7. Verified all works per task.

**Result**: New Prediction form now supports Single (1 match) and Combo (multiple matches based on tier). Pricing shows USD, converts to GHS for Paystack. "Fixed match" added. five odds $5, ten $10. No verified pick references (wasn't present).

Run `npm run dev` to test /admin New Prediction → select tier → see dynamic forms → save → check database.

Live demo command: `npm run dev`

