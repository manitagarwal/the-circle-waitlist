import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Buckets } from '@/components/Buckets';
import { LetterBadge } from '@/components/lists';
import { toneFor } from '@/lib/tones';
import { isDark } from '@/theme';
/** The activity colour at about a third of its strength, for card backgrounds. */
const tint = (hex: string) => `${hex}55`;
import { FilterBar, Segmented, SectionLabel, State, TabHeader } from '@/components/lists';
import { Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { type BookingRow, genderWanted, groupByDay, joinCheck, spots, timeRange } from '@/lib/bookings';
import { bucket, interestIndex, loadInterestGroups } from '@/lib/interests';
import { useLoad } from '@/lib/useLoad';

function Card({ b, onPress, note, group }: { b: BookingRow; onPress: () => void; note?: string | null; group?: string }) {
  const sp = spots(b);
  const mix = genderWanted(b);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: toneFor(b.interest_name, isDark) ? tint(toneFor(b.interest_name, isDark)!) : colors.surface, borderRadius: radius.card, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 14, alignItems: 'center' })}>
      <LetterBadge name={b.title} activity={b.interest_name} size={56} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.title, fontSize: 21, color: colors.ink }}>{b.title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{timeRange(b.starts_at, b.ends_at)}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>{[b.venue_name, b.area].filter(Boolean).join(', ')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink }}>{sp.count}{mix ? `, ${mix}` : ''}</Text>
          </View>
          {note ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{note}</Text> : sp.left ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted }}>{sp.left}</Text> : null}
        </View>
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
    return { upcoming, mine, me, groups, idx: interestIndex(groups) };
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
        <Pressable accessibilityRole="button" accessibilityLabel="Host a booking" onPress={() => r.push('/booking/new')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" color={colors.inkOn} strokeWidth={2.2} /></Pressable>} />
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
        <Buckets buckets={bucket(data.groups, shown, (b) => b.interest_id)} render={(items) => (<>
            {groupByDay(items).map((g) => (
              <View key={g.day}>
                <SectionLabel>{g.day}</SectionLabel>
                {g.rows.map((b) => <Card key={b.id} b={b} onPress={() => open(b.id)} note={b.is_host ? 'Hosting' : b.my_status === 'joined' ? "You're in" : null} />)}
              </View>
            ))}
        </>)} />
      </>) : null}

      {data && seg === 'mine' ? (<>
        <State empty={data.mine.length === 0 ? "You haven't joined or hosted anything yet." : null} />
        <Buckets buckets={bucket(data.groups, data.mine, (b) => b.interest_id)} render={(items) => (<>
            {items.map((b) => {
              const over = new Date(b.ends_at).getTime() < now;
              const needsMarking = b.is_host && over && b.status !== 'cancelled';
              return (
                <View key={b.id}>
                  <Card b={b} onPress={() => open(b.id)} note={b.status === 'cancelled' ? 'Cancelled' : b.is_host ? (over ? 'Finished' : 'Hosting') : over ? 'Finished' : "You're in"} />
                  {needsMarking ? (
                    <Pressable accessibilityRole="button" onPress={() => r.push({ pathname: '/booking/attendance/[id]', params: { id: b.id } })} style={{ marginTop: -4, marginBottom: 12, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="check" size={18} color={colors.goldText} /><Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.goldText }}>Mark who showed up</Text>
                    </Pressable>) : null}
                </View>
              );
            })}
        </>)} />
      </>) : null}
    </Screen>
  );
}
