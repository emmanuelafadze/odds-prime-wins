export const PRICING = {
  single:  { name: "Single Fixed Match", price: 12.5, desc: "One Fixed correct-score pick (200 GHS)", tier: "single" as const },
  combo:   { name: "Daily 2 Fixed Score Combo", price: 18.75, desc: "Two correct-score picks bundled (300 GHS)", tier: "combo" as const },
  five:    { name: "Daily 5 Odds", price: 6.25, desc: "5-odd accumulator of the day (100 GHS)", tier: "five" as const },
  ten:     { name: "Daily 10 Odds", price: 62.5, desc: "10-odd accumulator of the day (1000 GHS)", tier: "ten" as const },
  premium: { name: "Premium Subscription", price: 62.5, desc: "3 continuous correct scores in a row (1000 GHS)", tier: "premium" as const },
};
export type TierKey = keyof typeof PRICING;
