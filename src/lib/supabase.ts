import { createClient } from "@supabase/supabase-js";

// Fallback to empty strings so the module loads at build time without throwing.
// The actual values are required at runtime (notify route checks for them).
export const supabase = createClient(
  process.env.SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_ANON_KEY ?? "placeholder"
);
