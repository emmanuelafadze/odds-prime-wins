export const PRICING = {
  single:  { name: "Single Fixed Match", price: 200, desc: "One Fixed correct-score pick", tier: "single" as const },
  combo:   { name: "Daily 2 Fixed Score Combo", price: 300, desc: "Two correct-score picks bundled", tier: "combo" as const },
  five:    { name: "Daily 5 Odds", price: 100, desc: "5-odd accumulator of the day", tier: "five" as const },
  ten:     { name: "Daily 10 Odds", price: 150, desc: "10-odd accumulator of the day", tier: "ten" as const },
  premium: { name: "Premium Subscription", price: 1000, desc: "3 continuous correct scores in a row", tier: "premium" as const },
};

export type TierKey = keyof typeof PRICING;

