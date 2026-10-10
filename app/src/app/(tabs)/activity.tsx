import React, { useState } from 'react';
import { RemoteImage } from '@/components/RemoteImage';
import { FadeUp } from '@/components/motion';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Button } from '@/components/ui';
import { State, TabHeader } from '@/components/lists';
import { colors, fonts } from '@/theme';
import { describe } from '@/lib/activity';
import { ago } from '@/lib/format';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';

export default function Activity() {
  const r = useRouter();
  const { data, error, loading, refreshing, pull, reload } = useLoad(() => api.notifications());
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id); setErr(null);
    try { await fn(); await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(null); }
  };
  const unread = data?.filter((n) => n.is_unread).length ?? 0;

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Activity" right={unread > 0 ? (
        <Text accessibilityRole="button" onPress={() => run('all', () => api.markAllRead())} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, textDecorationLine: 'underline', padding: 10 }}>Mark all read</Text>) : undefined} />
      <State loading={loading} error={error} onRetry={reload} empty={data && data.length === 0 ? 'Nothing yet. When something needs you, it shows up here.' : null} />
      {err ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.error, marginVertical: 8 }}>{err}</Text> : null}
      {data?.map((n, idx) => {
        const v = describe(n);
        const open = () => {
          if (n.is_unread) void api.markRead(n.id).then(reload).catch(() => {});
          if (v.go?.to === 'booking' && v.go.id) r.push({ pathname: '/booking/[id]', params: { id: v.go.id } });
          else if (v.go?.to === 'member' && v.go.id) r.push({ pathname: '/member/[id]', params: { id: v.go.id } });
          else if (v.go?.to === 'events' && v.go.id) r.push({ pathname: '/event/[id]', params: { id: v.go.id } });
          else if (v.go) r.push((`/${v.go.to === 'booking' ? 'bookings' : v.go.to}${v.go.tab ? `?tab=${v.go.tab}` : ''}`) as never);
        };
        return (
          <FadeUp key={n.id} delay={Math.min(idx, 8) * 60}>
          <Pressable accessibilityRole={v.go ? 'button' : undefined} disabled={!v.go && !n.is_unread} onPress={open}
            style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View style={{ width: 10, paddingTop: 7 }}>{n.is_unread ? <View accessibilityLabel="Unread" style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.clay }} /> : null}</View>
            <View style={{ flex: 1 }}>
              {v.from ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.goldText, marginBottom: 2 }}>{v.from}</Text> : null}
              <Text style={{ fontFamily: n.is_unread ? fonts.bodySemi : fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink }}>{v.title}</Text>
              {v.body ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{v.body}</Text> : null}
              {v.image ? <RemoteImage path={v.image} height={170} label="Picture in the announcement" /> : null}
              {v.actions === 'friend' && v.fromId ? (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Button label="Accept" loading={busy === n.id} onPress={() => run(n.id, async () => { await api.respondFriend(v.fromId!, true); await api.markRead(n.id); })} style={{ flex: 1, height: 44 }} />
                  <Button label="Not now" variant="secondary" disabled={busy === n.id} onPress={() => run(n.id, async () => { await api.respondFriend(v.fromId!, false); await api.markRead(n.id); })} style={{ flex: 1, height: 44 }} />
                </View>
              ) : null}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>{ago(n.created_at)}</Text>
          </Pressable>
          </FadeUp>
        );
      })}
    </Screen>
  );
}
