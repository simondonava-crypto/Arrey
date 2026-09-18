// Fill these in from your Supabase project: Settings -> API.
// The anon/public key is meant to be exposed client-side like this - it's
// safe because the row-level security policies in supabase-setup.sql are
// what actually control who can read or write what, not secrecy of this key.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabaseClient;
try {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.style.cssText = "background:#c23b30;color:#fff;padding:12px 20px;text-align:center;font-size:0.9rem;";
    banner.textContent = "This page isn't connected to a database yet — fill in SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase-client.js.";
    document.body.prepend(banner);
  });
}
