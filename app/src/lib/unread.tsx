import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { api, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const Ctx = createContext(0);
export const useUnread = () => useContext(Ctx);

/** Unread count for the Activity bell: refreshed on open, on coming back to the app, and live on new notifications. */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const memberId = member?.id;
  const [n, setN] = useState(0);
  const load = useCallback(() => { api.unreadCount().then(setN).catch(() => {}); }, []);
  useEffect(() => {
    if (!memberId) return;
    load();
    const ch = supabase.channel(`notifications:${memberId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `member_id=eq.${memberId}` }, load)
      .subscribe();
    const app = AppState.addEventListener('change', (st) => { if (st === 'active') load(); });
    return () => { supabase.removeChannel(ch); app.remove(); };
  }, [memberId, load]);
  return <Ctx.Provider value={n}>{children}</Ctx.Provider>;
}
