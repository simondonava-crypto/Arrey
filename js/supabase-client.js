// Fill these in from your Supabase project: Settings -> API.
// The anon/public key is meant to be exposed client-side like this - it's
// safe because the row-level security policies in supabase-setup.sql are
// what actually control who can read or write what, not secrecy of this key.
const SUPABASE_URL = "https://rkmhknnchlghgmcvlywq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWhrbm5jaGxnaGdtY3ZseXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3OTg5MjEsImV4cCI6MjEwNTM3NDkyMX0.nmyRvgo33RcKtfIieosJJvbKvx544GWf9feo_FcdC8Q";

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
