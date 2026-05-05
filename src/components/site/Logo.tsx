import logo from "@/assets/oddsprime-logo.jpeg";
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src={logo} alt="ODDSPrime — Prime Odds, Smart Wins" className={`${className} rounded-md object-cover`} />;
}
