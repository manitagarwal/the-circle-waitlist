import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Buckets } from '@/components/Buckets';
import { ArchBadge, FilterBar, LetterBadge, RingBadge, Row, SectionLabel, Segmented, Sheet, State, TabHeader } from '@/components/lists';
import { Body, Button, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { applyFilters, channelFit, channelSummary, filterOptions, FITS_ME, GENDER_AUDIENCE, type Filters } from '@/lib/channels';
import { bucket, loadInterestGroups } from '@/lib/interests';
import { endsIn, listStamp } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';
import { INTERESTS_MIN } from '@/lib/profile';
import { useUnread } from '@/lib/unread';

type Seg = 'lobby' | 'public' | 'booking';
export default function Channels() {
  const r = useRouter();
  const unread = useUnread();
  const [seg, setSeg] = useState<Seg>('lobby');
  const [filters, setFilters] = useState<Filters>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [browse, setBrowse] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [channels, previews, expiry, groups, me] = await Promise.all([api.channels(), api.channelPreviews(), api.bookingChatExpiry(), loadInterestGroups(() => api.interestGroups()), api.myProfileBasics()]);
    const interestCount = await api.myInterestCount().catch(() => 5);
    return { interestCount, channels, previews: Object.fromEntries(previews.map((p) => [p.channel_id, p])), expiry, groups, me };
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
      <TabHeader title="Chats" right={
        <Pressable accessibilityRole="button" accessibilityLabel="New channel" onPress={() => r.push('/channel/new')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" color={colors.inkOn} strokeWidth={2.2} /></Pressable>} />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'lobby', label: 'Lobby' }, { value: 'public', label: 'Public' }, { value: 'booking', label: 'Booking' }]} />
      <State loading={loading} error={error} onRetry={reload} />
      {data && data.interestCount < INTERESTS_MIN ? (
        <View style={{ marginVertical: 8, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, gap: 10 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Our activities have changed. Choose at least {INTERESTS_MIN} that you like.</Text>
          <Button label="Choose activities" onPress={() => r.push('/settings/interests')} style={{ height: 44 }} />
        </View>) : null}
      {actionErr ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.error, marginVertical: 8 }}>{actionErr}</Text> : null}

      {data && seg === 'lobby' ? (<>
        <Pressable accessibilityRole="button" onPress={() => setBrowse(true)} style={{ alignSelf: 'flex-end', paddingVertical: 8 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' }}>Browse all lobbies</Text>
        </Pressable>
        {lobby.length === 0 ? <State empty="You haven't joined a lobby yet. Browse all lobbies and pick the ones you like." /> : null}
        <Buckets buckets={lobbyShown} render={(items) => (<>
            {items.map((c) => (
              <Row key={c.id} unread={unread.byChannel[c.id]} left={<RingBadge name={c.name} activity={c.interest_name} unread={!!unread.byChannel[c.id]} />} title={c.name} subtitle={preview(c.id)} meta={data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} onPress={() => open(c.id)} />
            ))}
        </>)} />
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
        <Buckets buckets={publicShown} render={(items) => (<>
            {items.map((c) => {
              const why = c.is_member ? null : channelFit(c, data.me);
              return (
                <Row key={c.id} unread={c.is_member ? unread.byChannel[c.id] : undefined} left={<RingBadge name={c.name} activity={c.interest_name} unread={c.is_member && !!unread.byChannel[c.id]} />} title={c.name} subtitle={`${c.interest_name}. ${channelSummary(c)}${why ? ` ${why}` : ''}`} onPress={() => open(c.id)}
                  right={c.is_member ? (unread.byChannel[c.id] ? undefined : <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted }}>Joined</Text>)
                    : why ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint, maxWidth: 70, textAlign: 'center' }}>Not for you</Text>
                    : <Button label="Join" variant="secondary" loading={busy === c.id} onPress={() => act(c.id, () => api.joinChannel(c.id))} style={{ height: 40, paddingHorizontal: 16 }} />} />
              );
            })}
        </>)} />
      </>) : null}

      {data && seg === 'booking' ? (<>
        {mine.length === 0 ? <State empty="Nothing here yet. When you join or host a booking, its chat shows up here." /> : null}
        {mine.map((c) => {
          const ends = endsIn(data.expiry[c.id] ?? null);
          return (
            <Row key={c.id} unread={unread.byChannel[c.id]} left={<RingBadge name={c.name} activity={c.interest_name} unread={!!unread.byChannel[c.id]} />} title={c.name} subtitle={preview(c.id) ?? 'Booking chat'}
              meta={ends ? ends.toUpperCase() : data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} tag={ends} onPress={() => open(c.id)} />
          );
        })}
      </>) : null}

      <Sheet visible={browse} onClose={() => setBrowse(false)} title="Lobbies">
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator nestedScrollEnabled>
          {data ? bucket(data.groups, data.channels.filter((c) => c.kind === 'lobby'), (c) => c.interest_id).map((b) => (
            <View key={b.group.id}>
              <SectionLabel>{b.group.name}</SectionLabel>
              {b.items.map((c) => (
                <Row key={c.id} left={<LetterBadge name={c.name} activity={c.interest_name} size={44} />} title={c.name}
                  right={<Button label={c.is_member ? 'Leave' : 'Join'} variant={c.is_member ? 'secondary' : 'primary'} loading={busy === c.id} onPress={() => act(c.id, () => (c.is_member ? api.leaveChannel(c.id) : api.joinChannel(c.id)))} style={{ height: 38, paddingHorizontal: 16 }} />} />
              ))}
            </View>
          )) : null}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
