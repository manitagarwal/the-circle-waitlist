export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://qjtuahvhszxektzdmmdf.supabase.co';
// Public anon key (safe to ship; RLS and functions are the security layer).
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdHVhaHZoc3p4ZWt0emRtbWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzkzNDUsImV4cCI6MjEwNTc1NTM0NX0.Blt9FzDgZq_BgoraEraJVZwMcIEtZh7oXkrNWm-N-aQ';
export const CITIES = ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad', 'Other'] as const;
// Set by the publish workflow to the commit it was built from, so a phone can show which version it is running.
export const BUILD = (process.env.EXPO_PUBLIC_BUILD ?? 'dev').slice(0, 7);
export const SITE_URL = 'https://thesemicircle.in';
