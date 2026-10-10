import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Buckets } from '@/components/Buckets';
import { EventCard } from '@/components/EventCard';
import { Segmented, SectionLabel, State, TabHeader } from '@/components/lists';
import { Screen } from '@/components/ui';
import { api } from '@/lib/auth';
import { bookingDay, groupByDay } from '@/lib/bookings';
import { bucket, loadInterestGroups } from '@/lib/interests';
import { useLoad } from '@/lib/useLoad';

export default function Events() {
  const r = useRouter();
  const [seg, setSeg] = useState<'upcoming' | 'mine'>('upcoming');
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [events, groups] = await Promise.all([api.events(), loadInterestGroups(() => api.interestGroups())]);
    return { events, groups };
  });
  const open = (id: string) => r.push({ pathname: '/event/[id]', params: { id } });
  const now = Date.now();

  const upcoming = useMemo(() => (data?.events ?? []).filter((e) => e.status === 'published' && Date.parse(e.ends_at) > now), [data, now]);
  const loose = upcoming.filter((e) => e.interest_id == null);
  const mine = useMemo(() => (data?.events ?? []).filter((e) => e.my_status && e.my_status !== 'cancelled').sort((a, b) => b.starts_at.localeCompare(a.starts_at)), [data]);

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Events" />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'mine', label: 'Mine' }]} />
      <State loading={loading} error={error} onRetry={reload}
        empty={data && seg === 'upcoming' && upcoming.length === 0 ? 'No events right now. We announce new ones here and in Activity.' : data && seg === 'mine' && mine.length === 0 ? "You haven't reserved a spot at an event yet." : null} />
      {data && seg === 'upcoming' ? (<>
        <Buckets buckets={[...bucket(data.groups, upcoming, (e) => e.interest_id), ...(loose.length ? [{ group: { id: 'more', name: 'More events' }, items: loose }] : [])]}
          render={(items) => groupByDay(items).map((g) => <View key={g.day}><SectionLabel>{g.day}</SectionLabel>{g.rows.map((e) => <EventCard key={e.id} e={e} onPress={() => open(e.id)} />)}</View>)} />
      </>) : null}
      {data && seg === 'mine' ? mine.map((e) => <EventCard key={e.id} e={e} onPress={() => open(e.id)} />) : null}
    </Screen>
  );
}
