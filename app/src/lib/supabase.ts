import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import { authStorage } from './storage';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// A throwaway client with no stored session. It is used only to prove the person can read their
// work inbox (emailed code); it never replaces the signed-in personal-email session.
const memory: Record<string, string> = {};
export const workVerifier = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'sb-work-verify', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
    storage: { getItem: (k) => memory[k] ?? null, setItem: (k, v) => void (memory[k] = v), removeItem: (k) => void delete memory[k] },
  },
});
