import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Tabs } from 'expo-router';
import { AppBar } from '@/components/AppBar';
import { Icon } from '@/components/Icon';
import { colors, fonts } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** Unread count for the Activity tab: refreshed on open, on coming back to the app, and live on new notifications. */
function useUnread(memberId: string | undefined) {
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
  return n;
}

export default function TabsLayout() {
  const { member } = useAuth();
  const unread = useUnread(member?.id);
  const icon = (name: string) => ({ color }: { color: unknown }) => <Icon name={name} size={24} color={String(color)} />;
  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: () => <AppBar unread={unread} />,
      tabBarActiveTintColor: colors.goldText, tabBarInactiveTintColor: colors.faint,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 72, paddingTop: 8, paddingBottom: 16 },
      tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      sceneStyle: { backgroundColor: colors.ground },
    }}>
      <Tabs.Screen name="channels" options={{ title: 'Channels', tabBarIcon: icon('channels') }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: icon('bookings') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('profile') }} />
      {/* Activity and Messages live in the top bar, not in the bottom bar */}
      <Tabs.Screen name="activity" options={{ title: 'Activity', href: null }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', href: null }} />
    </Tabs>
  );
}
