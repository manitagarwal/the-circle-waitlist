import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GrowBar } from '@/components/motion';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Icon } from '@/components/Icon';
import { DayDivider, Row, Segmented, State } from '@/components/lists';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { buildHistory, byActivity, monthKey } from '@/lib/history';
import { useLoad } from '@/lib/useLoad';

export default function History() {
  const r = useRouter();
  const [view, setView] = useState<'list' | 'activity'>('list');
  const [seg, setSeg] = useState<'all' | 'booking' | 'event'>('all');
  const { data, error, loading, reload } = useLoad(async () => {
    const [b, e] = await Promise.all([api.bookingsHistory(), api.events()]);
    return buildHistory(b, e);
  });
  const shown = useMemo(() => (data ?? []).filter((h) => seg === 'all' || h.kind === seg), [data, seg]);
  const open = (h: { kind: string; id: string }) => (h.kind === 'booking' ? r.push({ pathname: '/booking/[id]', params: { id: h.id } }) : r.push({ pathname: '/event/[id]', params: { id: h.id } }));
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Your history" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Segmented value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'activity', label: 'By activity' }]} />
        {view === 'activity' && data ? (<View style={{ marginTop: 22 }}>
          {byActivity(data).length === 0 ? <State empty="Nothing to count yet." /> : byActivity(data).map((a, _i, all) => (
            <View key={a.activity} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{a.activity}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>{a.n}</Text>
              </View>
              <GrowBar pct={(a.n / all[0].n) * 100} color={colors.ink} track={colors.line} height={10} />
            </View>))}
        </View>) : (<>
        <View style={{ height: 12 }} />
        <Segmented value={seg} onChange={setSeg} options={[{ value: 'all', label: 'All' }, { value: 'booking', label: 'Bookings' }, { value: 'event', label: 'Events' }]} />
        <State loading={loading} error={error} onRetry={reload} empty={data && shown.length === 0 ? 'Nothing here yet. Things you host, join or attend will collect here.' : null} />
        {shown.map((h, i) => (
          <View key={h.key}>
            {i === 0 || monthKey(shown[i - 1].when) !== monthKey(h.when) ? <DayDivider label={monthKey(h.when)} /> : null}
            <Row title={h.title} subtitle={[h.outcome, h.kind === 'event' ? 'Event' : 'Booking'].join(' · ')}
              meta={new Date(h.when).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + (h.place ? ` · ${h.place}` : '')}
              right={<Icon name="chevron" size={18} color={colors.faint} />} onPress={() => open(h)} />
          </View>))}
        </>)}
      </ScrollView>
    </View>
  );
}
