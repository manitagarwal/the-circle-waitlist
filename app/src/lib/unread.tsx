import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { api, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type Unread = {
  /** Unread notifications (the Activity bell). */
  activity: number;
  /** Unread messages in direct messages and groups (the Messages icon). */
  messages: number;
  /** Unread messages per channel id, for the dots in lists. */
  byChannel: Record<string, number>;
  refresh: () => void;
};
const empty: Unread = { activity: 0, messages: 0, byChannel: {}, refresh: () => {} };
const Ctx = createContext<Unread>(empty);
export const useUnread = () => useContext(Ctx);

/** Unread counts: refreshed on open, on coming back to the app, and live on new notifications and messages. */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const memberId = member?.id;
  const [activity, setActivity] = useState(0);
  const [rows, setRows] = useState<{ channel_id: string; kind: string; unread: number }[]>([]);
  const load = useCallback(() => {
    api.unreadCount().then((n) => setActivity(Number(n) || 0)).catch(() => {});
    api.unreadMessages().then((r) => setRows((r ?? []).map((x) => ({ ...x, unread: Number(x.unread) })))).catch(() => {});
  }, []);
  useEffect(() => {
    if (!memberId) return;
    load();
    api.noteSignIn().catch(() => {});
    const ch = supabase.channel(`unread:${memberId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `member_id=eq.${memberId}` }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe();
    const app = AppState.addEventListener('change', (st) => { if (st === 'active') { load(); api.noteSignIn().catch(() => {}); } });
    return () => { supabase.removeChannel(ch); app.remove(); };
  }, [memberId, load]);
  const value = useMemo<Unread>(() => ({
    activity,
    messages: rows.filter((r) => r.kind === 'dm' || r.kind === 'private').reduce((n, r) => n + r.unread, 0),
    byChannel: Object.fromEntries(rows.map((r) => [r.channel_id, r.unread])),
    refresh: load,
  }), [activity, rows, load]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
