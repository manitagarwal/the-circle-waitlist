import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { createApi } from './api';

export type Member = { id: string; username: string; state: string; role: string; onboarded_at: string | null };
export type Gate = 'loading' | 'public' | 'invited' | 'setup' | 'app';

type Ctx = {
  session: Session | null; member: Member | null; gate: Gate; recovery: boolean;
  startRecovery: () => void; endRecovery: () => void; refreshMember: () => Promise<void>; signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>(null as never);
export const api = createApi(supabase);
export const useAuth = () => useContext(AuthCtx);

async function loadMember(id: string): Promise<Member | null> {
  const { data } = await supabase.from('members').select('id, username, state, role, onboarded_at').eq('id', id).maybeSingle();
  return (data as Member | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const recoveryRef = useRef(false);

  const sync = useCallback(async (s: Session | null) => {
    setSession(s);
    const m = s ? await loadMember(s.user.id) : null;
    // banned or deleted accounts get nothing
    if (m && (m.state === 'banned' || m.state === 'deleted')) {
      await supabase.auth.signOut();
      setSession(null); setMember(null);
      return;
    }
    setMember(m);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => sync(data.session)).finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') { recoveryRef.current = false; setRecovery(false); }
      // defer: never await supabase calls inside this callback
      setTimeout(() => void sync(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [sync]);

  const value = useMemo<Ctx>(() => {
    const gate: Gate = !ready ? 'loading' : !session ? 'public' : !member ? 'invited' : member.onboarded_at ? 'app' : 'setup';
    return {
      session, member, gate, recovery,
      startRecovery: () => { recoveryRef.current = true; setRecovery(true); },
      endRecovery: () => { recoveryRef.current = false; setRecovery(false); },
      refreshMember: async () => { if (session) setMember(await loadMember(session.user.id)); },
      signOut: async () => { await supabase.auth.signOut(); },
    };
  }, [ready, session, member, recovery]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
