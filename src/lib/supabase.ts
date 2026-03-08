import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = "https://zxzolpczwjwfgmiqsuko.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4em9scGN6d2p3ZmdtaXFzdWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQzNTEsImV4cCI6MjA4ODUzMDM1MX0.8Bxlx5P-KeSe78ApFPNyrSv7jWBz4hL3OL9Z3V4sSwY";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
