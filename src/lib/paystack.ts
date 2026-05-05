import { PAYSTACK_PUBLIC_KEY } from "./supabase";

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).PaystackPop) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => res();
    s.onerror = () => rej(new Error("Paystack failed to load"));
    document.head.appendChild(s);
  });
  return loading;
}

export async function payWithPaystack(opts: {
  email: string; amountGhs: number; metadata?: Record<string, any>;
  onSuccess: (ref: string) => void; onClose?: () => void;
}) {
  await loadScript();
  const handler = (window as any).PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: opts.email,
    amount: Math.round(opts.amountGhs * 100),
    currency: "GHS",
    metadata: opts.metadata ?? {},
    callback: (resp: any) => opts.onSuccess(resp.reference),
    onClose: () => opts.onClose?.(),
  });
  handler.openIframe();
}
