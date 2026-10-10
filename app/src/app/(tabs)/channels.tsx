import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Collapsible } from '@/components/Collapsible';
import { ArchBadge, FilterBar, RingBadge, Row, Segmented, State, TabHeader } from '@/components/lists';
import { Body, Button, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { applyFilters, channelFit, channelSummary, filterOptions, FITS_ME, GENDER_AUDIENCE, type Filters } from '@/lib/channels';
import { bucket, loadInterestGroups } from '@/lib/interests';
import { endsIn, listStamp } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';

type Seg = 'lobby' | 'public' | 'booking';
/** A yellow ring means something was posted in the last day. */
const isFresh = (iso?: string) => !!iso && Date.now() - new Date(iso).getTime() < 86400000;
export default function Channels() {
  const r = useRouter();
  const [seg, setSeg] = useState<Seg>('lobby');
  const [filters, setFilters] = useState<Filters>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [channels, previews, expiry, groups, me] = await Promise.all([api.channels(), api.channelPreviews(), api.bookingChatExpiry(), loadInterestGroups(() => api.interestGroups()), api.myProfileBasics()]);
    return { channels, previews: Object.fromEntries(previews.map((p) => [p.channel_id, p])), expiry, groups, me };
  });

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id); setActionErr(null);
    try { await fn(); await reload(); } catch (e) { setActionErr(friendly(e)); } finally { setBusy(null); }
  };

  const lobby = useMemo(() => (data?.channels ?? []).filter((c) => c.kind === 'lobby' && c.is_member)
    .sort((a, b) => (data!.previews[b.id]?.last_at ?? '').localeCompare(data!.previews[a.id]?.last_at ?? '') || a.name.localeCompare(b.name)), [data]);
  const publicAll = useMemo(() => (data?.channels ?? []).filter((c) => c.kind === 'public'), [data]);
  const publicShown = useMemo(() => (data ? bucket(data.groups, applyFilters(publicAll, filters, data.me).sort((a, b) => (a.interest_name ?? '').localeCompare(b.interest_name ?? '') || b.member_count - a.member_count), (c) => c.interest_id) : []), [data, publicAll, filters]);
  const lobbyShown = useMemo(() => (data ? bucket(data.groups, lobby, (c) => c.interest_id) : []), [data, lobby]);
  const mine = useMemo(() => (data?.channels ?? []).filter((c) => c.kind === 'booking' && c.is_member)
    .sort((a, b) => (data!.previews[b.id]?.last_at ?? b.created_at).localeCompare(data!.previews[a.id]?.last_at ?? a.created_at)), [data]);

  const preview = (id: string) => {
    const p = data?.previews[id];
    return p ? `${p.from_me ? 'You' : p.sender_username ?? 'Someone'}: ${p.body}` : null;
  };
  const open = (id: string) => r.push({ pathname: '/channel/[id]', params: { id } });

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Channels" right={
        <Pressable accessibilityRole="button" accessibilityLabel="New channel" onPress={() => r.push('/channel/new')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" color="#ffffff" strokeWidth={2.2} /></Pressable>} />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'lobby', label: 'Lobby' }, { value: 'public', label: 'Public' }, { value: 'booking', label: 'Booking' }]} />
      <State loading={loading} error={error} onRetry={reload} />
      {actionErr ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.error, marginVertical: 8 }}>{actionErr}</Text> : null}

      {data && seg === 'lobby' ? (<>
        <Body style={{ fontSize: 14, marginBottom: 4 }}>One per activity, run by the team. Read-only, with polls you can vote in.</Body>
        {lobby.length === 0 ? <State empty="No Lobbies yet. Pick interests in Settings and they appear here." /> : null}
        {lobbyShown.map((b) => (
          <Collapsible key={b.group.id} title={b.group.name} count={b.items.length}>
            {b.items.map((c) => (
              <Row key={c.id} left={<RingBadge name={c.name} activity={c.interest_name} unread={isFresh(data.previews[c.id]?.last_at)} />} title={c.name} subtitle={preview(c.id)} meta={data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} onPress={() => open(c.id)} />
            ))}
          </Collapsible>
        ))}
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: 20 }}>Want another? Add an interest in Settings.</Text>
      </>) : null}

      {data && seg === 'public' ? (<>
        <FilterBar values={filters as Record<string, string | undefined>} onChange={(k, v) => setFilters((o) => ({ ...o, [k]: v }))} defs={[
          { key: 'city', label: 'City', options: filterOptions(publicAll, 'city') },
          { key: 'area', label: 'Area', options: filterOptions(publicAll, 'area') },
          { key: 'activity', label: 'Activity', options: filterOptions(publicAll, 'activity') },
          { key: 'gender', label: 'Gender', options: Object.values(GENDER_AUDIENCE) },
          { key: 'fit', label: 'Fits me', options: [FITS_ME] },
        ]} />
        {publicAll.length === 0 ? <State empty="No public channels yet. Start the first one with the plus button." /> : null}
        {publicAll.length > 0 && publicShown.length === 0 ? <State empty="Nothing matches those filters." /> : null}
        {publicShown.map((b) => (
          <Collapsible key={b.group.id} title={b.group.name} count={b.items.length}>
            {b.items.map((c) => {
              const why = c.is_member ? null : channelFit(c, data.me);
              return (
                <Row key={c.id} left={<ArchBadge name={c.name} activity={c.interest_name} />} title={c.name} subtitle={`${c.interest_name}. ${channelSummary(c)}${why ? ` ${why}` : ''}`} onPress={() => open(c.id)}
                  right={c.is_member ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.sage }}>Joined</Text>
                    : why ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint, maxWidth: 70, textAlign: 'center' }}>Not for you</Text>
                    : <Button label="Join" variant="secondary" loading={busy === c.id} onPress={() => act(c.id, () => api.joinChannel(c.id))} style={{ height: 40, paddingHorizontal: 16 }} />} />
              );
            })}
          </Collapsible>
        ))}
      </>) : null}

      {data && seg === 'booking' ? (<>
        <Body style={{ fontSize: 14, marginBottom: 4 }}>The chats for bookings you host or have joined.</Body>
        {mine.length === 0 ? <State empty="Nothing here yet. When you join or host a booking, its chat shows up here." /> : null}
        {mine.map((c) => {
          const ends = endsIn(data.expiry[c.id] ?? null);
          return (
            <Row key={c.id} left={<ArchBadge name={c.name} activity={c.interest_name} />} title={c.name} subtitle={preview(c.id) ?? 'Booking chat'}
              meta={ends ? ends.toUpperCase() : data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} tag={ends} onPress={() => open(c.id)} />
          );
        })}
      </>) : null}

    </Screen>
  );
}
