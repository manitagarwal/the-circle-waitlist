import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Chip, State } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { clock } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';

export default function Attendance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const [mark, setMark] = useState<Record<string, boolean | undefined>>({});
  const [keep, setKeep] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(async () => {
    const [booking, roster] = await Promise.all([api.booking(id), api.bookingRoster(id)]);
    return { booking, guests: roster.filter((x) => !x.is_host) };
  }, [id]);
  const b = data?.booking;
  const todo = data?.guests.filter((g) => g.status === 'joined') ?? [];

  const confirm = async () => {
    setBusy(true); setErr(null);
    try {
      for (const g of todo) if (mark[g.member_id] !== undefined) await api.markAttendance(id, g.member_id, mark[g.member_id]!);
      if (keep) await api.keepBookingChat(id);
      r.replace({ pathname: '/booking/[id]', params: { id } });
    } catch (e) { setErr(friendly(e)); await reload(); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Who showed up?" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <State loading={loading} error={error} onRetry={reload} />
        {b ? (<>
          <Body>{b.title} finished at {clock(new Date(b.ends_at))}. Mark your guests.</Body>
          {data!.guests.length === 0 ? <State empty="Nobody else joined this one." /> : null}
          {data!.guests.map((g) => {
            const done = g.status !== 'joined';
            return (
              <View key={g.member_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <PersonAvatar person={g} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{g.username}</Text>
                  {done ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{g.status === 'attended' ? 'Marked as showed up' : 'Marked as no-show'}</Text> : null}
                </View>
                {!done ? (<View style={{ flexDirection: 'row' }}>
                  <Chip label="Showed up" on={mark[g.member_id] === true} onPress={() => setMark((m) => ({ ...m, [g.member_id]: true }))} />
                  <Chip label="No-show" on={mark[g.member_id] === false} onPress={() => setMark((m) => ({ ...m, [g.member_id]: false }))} />
                </View>) : null}
              </View>
            );
          })}
          <Body style={{ fontSize: 13, marginTop: 12 }}>Skip anyone and they count as showed up after 48 hours. A no-show costs a member their reliability score, so mark it only if it's true.</Body>

          {b.channel_id ? (
            <View style={{ marginTop: 24, padding: 14, backgroundColor: colors.surface, borderRadius: radius.card }}>
              <Text style={{ fontFamily: fonts.titleMedium, fontSize: 21, color: colors.ink }}>Keep the chat going?</Text>
              <Body style={{ fontSize: 14, marginTop: 4 }}>The booking chat closes a day after the game. Keep it and it becomes a private channel for this group. Only the host can keep it. It counts toward your 2 channels.</Body>
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Chip label="Keep this chat" on={keep === true} onPress={() => setKeep(true)} />
                <Chip label="Let it go" on={keep === false} onPress={() => setKeep(false)} />
              </View>
            </View>) : null}
          {err ? <Notice tone="error">{err}</Notice> : null}
          <Button label="Confirm" onPress={confirm} loading={busy} style={{ marginTop: 20 }} />
        </>) : null}
      </ScrollView>
    </View>
  );
}
