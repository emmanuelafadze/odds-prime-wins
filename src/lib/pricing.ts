export const PRICING = {
  single:  { name: "Single Fixed Match", price: 200, desc: "One Fixed correct-score pick", tier: "single" as const },
  combo:   { name: "Daily 2 Fixed Score Combo", price: 300, desc: "Two correct-score picks bundled", tier: "combo" as const },
  fixed_draw: { name: "Fixed Draw", price: 150, desc: "Three draw-focused matches", tier: "fixed_draw" as const },
  premium: { name: "Premium", price: 1000, desc: "Premium multi-match ticket", tier: "premium" as const },
};

export type TierKey = keyof typeof PRICING;
