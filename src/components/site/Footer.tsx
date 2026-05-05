import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { CONTACT_PHONE } from "@/lib/supabase";

export function Footer() {
  return (
    <footer className="border-t bg-navy text-navy-foreground">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-auto" />
            <span className="text-lg font-bold">ODDSPrime</span>
          </div>
          <p className="mt-3 text-sm text-navy-foreground/70">Prime Odds, Smart Wins. German's trusted prediction platform.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Predictions</h4>
          <ul className="mt-3 space-y-2 text-sm text-navy-foreground/70">
            <li><Link to="/free-predictions" className="hover:text-primary">Free Tips</Link></li>
            <li><Link to="/predictions" className="hover:text-primary">Premium</Link></li>
            <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-navy-foreground/70">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-navy-foreground/70">
            <li><Link to="/terms" className="hover:text-primary">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
            <li><Link to="/disclaimer" className="hover:text-primary">Disclaimer</Link></li>
          </ul>
          <p className="mt-3 text-sm text-navy-foreground/70">Call: <a href={`tel:${CONTACT_PHONE.replace(/\s/g,'')}`} className="text-primary">{CONTACT_PHONE}</a></p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-navy-foreground/50">
        © {new Date().getFullYear()} ODDSPrime. All rights reserved. 18+. Bet responsibly.
      </div>
    </footer>
  );
}
