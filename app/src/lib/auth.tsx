import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { createApi, type Application } from './api';
import { computeGate, type Gate } from './gate';
export type { Gate } from './gate';

export type Member = { id: string; username: string; state: string; role: string; onboarded_at: string | null };
type Ctx = {
  session: Session | null; member: Member | null; application: Application | null; hasPassword: boolean; gate: Gate; recovery: boolean;
  startRecovery: () => void; endRecovery: () => void; refresh: () => Promise<void>; signOut: () => Promise<void>;
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
  const [application, setApplication] = useState<Application | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const sessionRef = useRef<Session | null>(null);

  const sync = useCallback(async (s: Session | null) => {
    sessionRef.current = s;
    setSession(s);
    if (!s) { setMember(null); setApplication(null); setHasPassword(false); return; }
    const m = await loadMember(s.user.id);
    // banned or deleted accounts get nothing
    if (m && (m.state === 'banned' || m.state === 'deleted')) {
      await supabase.auth.signOut();
      setSession(null); setMember(null); setApplication(null); setHasPassword(false);
      return;
    }
    let a: Application | null = null;
    if (!m) { try { a = await api.myApplication(); } catch { a = null; } }
    let pw = false;
    try { pw = await api.hasPassword(); } catch { pw = false; }
    setMember(m); setApplication(a); setHasPassword(pw);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => sync(data.session)).finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') setRecovery(false);
      // defer: never await supabase calls inside this callback
      setTimeout(() => void sync(s), 0);
    });
    // coming back to the app is when an acceptance is most likely to have happened
    const app = AppState.addEventListener('change', (st) => { if (st === 'active') void sync(sessionRef.current); });
    return () => { sub.subscription.unsubscribe(); app.remove(); };
  }, [sync]);

  const value = useMemo<Ctx>(() => {
    const gate = computeGate({ ready, signedIn: !!session, member, applicationStatus: application?.status ?? null, hasPassword });
    return {
      session, member, application, hasPassword, gate, recovery,
      startRecovery: () => setRecovery(true),
      endRecovery: () => setRecovery(false),
      refresh: () => sync(sessionRef.current),
      signOut: async () => { await supabase.auth.signOut(); },
    };
  }, [ready, session, member, application, hasPassword, recovery, sync]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
