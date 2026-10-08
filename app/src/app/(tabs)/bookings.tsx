import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { FilterBar, Segmented, SectionLabel, State, TabHeader } from '@/components/lists';
import { Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { type BookingRow, genderWanted, groupByDay, joinCheck, spots, timeRange } from '@/lib/bookings';
import { interestIndex, loadInterestGroups } from '@/lib/interests';
import { useLoad } from '@/lib/useLoad';

function Card({ b, onPress, note, group }: { b: BookingRow; onPress: () => void; note?: string | null; group?: string }) {
  const sp = spots(b);
  const mix = genderWanted(b);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color: colors.goldText }}>{(group ? `${group} · ${b.interest_name}` : b.interest_name).toUpperCase()}</Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color: colors.faint }}>{b.kind === 'admin' ? 'HOSTED BY ADMIN' : 'PRIVATE EVENT'}</Text>
      </View>
      <Text style={{ fontFamily: fonts.titleMedium, fontSize: 19, color: colors.ink, marginTop: 4 }}>{b.title}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{timeRange(b.starts_at, b.ends_at)}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>{[b.venue_name, b.area].filter(Boolean).join(', ')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>{sp.count}</Text>
          {mix ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{mix}</Text> : null}
        </View>
        {note ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.sage }}>{note}</Text> : sp.left ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.goldText }}>{sp.left}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function Bookings() {
  const r = useRouter();
  const [seg, setSeg] = useState<'browse' | 'mine'>('browse');
  const [f, setF] = useState<Record<string, string | undefined>>({});
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [upcoming, mine, me, groups] = await Promise.all([api.bookingsUpcoming(), api.bookingsMine(), api.myProfileBasics(), loadInterestGroups(() => api.interestGroups())]);
    return { upcoming, mine, me, idx: interestIndex(groups) };
  });

  const shown = useMemo(() => (data?.upcoming ?? []).filter((b) =>
    (!f.area || b.area === f.area) && (!f.activity || b.interest_name === f.activity) &&
    (!f.mix || (f.mix === 'Open to men' ? (b.male_slots == null || b.male_slots > b.male_joined) : (b.female_slots == null || b.female_slots > b.female_joined)) && (b.male_slots != null || b.female_slots != null)) &&
    (!f.fit || joinCheck(b, data!.me).ok)), [data, f]);
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();
  const open = (id: string) => r.push({ pathname: '/booking/[id]', params: { id } });
  const now = Date.now();

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Bookings" right={
        <Pressable accessibilityRole="button" onPress={() => r.push('/booking/new')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.goldText }}>Host one</Text></Pressable>} />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'browse', label: 'Browse' }, { value: 'mine', label: 'Mine' }]} />
      <State loading={loading} error={error} onRetry={reload} />

      {data && seg === 'browse' ? (<>
        <FilterBar values={f} onChange={(k, v) => setF((o) => ({ ...o, [k]: v }))} defs={[
          { key: 'area', label: 'Area', options: uniq(data.upcoming.map((b) => b.area)) },
          { key: 'activity', label: 'Activity', options: uniq(data.upcoming.map((b) => b.interest_name)) },
          { key: 'mix', label: 'Gender mix', options: ['Open to men', 'Open to women'] },
          { key: 'fit', label: 'Fits me', options: ['Only ones I can join'] },
        ]} />
        <State empty={shown.length === 0 && !loading ? (data.upcoming.length === 0 ? 'No bookings yet. Host the first one.' : 'Nothing matches those filters.') : null} />
        {groupByDay(shown).map((g) => (
          <View key={g.day}>
            <SectionLabel>{g.day}</SectionLabel>
            {g.rows.map((b) => <Card key={b.id} b={b} group={data.idx.get(b.interest_id)?.group} onPress={() => open(b.id)} note={b.is_host ? 'Hosting' : b.my_status === 'joined' ? "You're in" : null} />)}
          </View>
        ))}
      </>) : null}

      {data && seg === 'mine' ? (<>
        <State empty={data.mine.length === 0 ? "You haven't joined or hosted anything yet." : null} />
        {data.mine.map((b) => {
          const over = new Date(b.ends_at).getTime() < now;
          const needsMarking = b.is_host && over && b.status !== 'cancelled';
          return (
            <View key={b.id}>
              <Card b={b} group={data.idx.get(b.interest_id)?.group} onPress={() => open(b.id)} note={b.status === 'cancelled' ? 'Cancelled' : b.is_host ? (over ? 'Finished' : 'Hosting') : over ? 'Finished' : "You're in"} />
              {needsMarking ? (
                <Pressable accessibilityRole="button" onPress={() => r.push({ pathname: '/booking/attendance/[id]', params: { id: b.id } })} style={{ marginTop: -4, marginBottom: 12, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="check" size={18} color={colors.goldText} /><Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.goldText }}>Mark who showed up</Text>
                </Pressable>) : null}
            </View>
          );
        })}
      </>) : null}
    </Screen>
  );
}
