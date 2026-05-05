import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://akdudfjknndteqbfrzhw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHVkZmprbm5kdGVxYmZyemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjM2NjksImV4cCI6MjA5MzUzOTY2OX0.g0OTK9io_z9Q8c5_uyfv3pmMhknIrZUciF-MBCB1ggs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const PAYSTACK_PUBLIC_KEY = "pk_live_3fd60f2bde18a116e1b7173630cedf4744b678db";
export const CONTACT_PHONE = "+233 50 895 7567";
export const SITE_URL = "https://oddsprime.online";
