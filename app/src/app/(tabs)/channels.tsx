import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Collapsible } from '@/components/Collapsible';
import { FilterBar, LetterBadge, Row, Segmented, State, TabHeader } from '@/components/lists';
import { Body, Button, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { applyFilters, channelFit, channelSummary, filterOptions, FITS_ME, GENDER_AUDIENCE, type Filters } from '@/lib/channels';
import { bucket, loadInterestGroups } from '@/lib/interests';
import { endsIn, listStamp } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';

type Seg = 'lobby' | 'public' | 'private';
export default function Channels() {
  const r = useRouter();
  const [seg, setSeg] = useState<Seg>('lobby');
  const [filters, setFilters] = useState<Filters>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [channels, previews, invites, expiry, groups, me] = await Promise.all([api.channels(), api.channelPreviews(), api.channelInvites(), api.bookingChatExpiry(), loadInterestGroups(() => api.interestGroups()), api.myProfileBasics()]);
    return { channels, previews: Object.fromEntries(previews.map((p) => [p.channel_id, p])), invites, expiry, groups, me };
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
  const mine = useMemo(() => (data?.channels ?? []).filter((c) => (c.kind === 'private' || c.kind === 'booking') && c.is_member)
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
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" color={colors.goldText} /></Pressable>} />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'lobby', label: 'Lobby' }, { value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
      <State loading={loading} error={error} onRetry={reload} />
      {actionErr ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.error, marginVertical: 8 }}>{actionErr}</Text> : null}

      {data && seg === 'lobby' ? (<>
        <Body style={{ fontSize: 14, marginBottom: 4 }}>One per activity, run by the team. Read-only, with polls you can vote in.</Body>
        {lobby.length === 0 ? <State empty="No Lobbies yet. Pick interests in Settings and they appear here." /> : null}
        {lobbyShown.map((b) => (
          <Collapsible key={b.group.id} title={b.group.name} count={b.items.length}>
            {b.items.map((c) => (
              <Row key={c.id} left={<LetterBadge name={c.name} />} title={c.name} subtitle={preview(c.id)} meta={data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} onPress={() => open(c.id)} />
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
                <Row key={c.id} left={<LetterBadge name={c.name} />} title={c.name} subtitle={`${c.interest_name}. ${channelSummary(c)}${why ? ` ${why}` : ''}`} onPress={() => open(c.id)}
                  right={c.is_member ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.sage }}>Joined</Text>
                    : why ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint, maxWidth: 70, textAlign: 'center' }}>Not for you</Text>
                    : <Button label="Join" variant="secondary" loading={busy === c.id} onPress={() => act(c.id, () => api.joinChannel(c.id))} style={{ height: 40, paddingHorizontal: 16 }} />} />
              );
            })}
          </Collapsible>
        ))}
      </>) : null}

      {data && seg === 'private' ? (<>
        <Body style={{ fontSize: 14, marginBottom: 4 }}>Invite only. You'll only see the ones you're in.</Body>
        {data.invites.map((inv) => (
          <View key={inv.id} style={{ marginTop: 12, padding: 14, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.goldBorder }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color: colors.goldText }}>INVITATION</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 4 }}>
              <Text style={{ fontFamily: fonts.bodySemi }}>{inv.inviter_username}</Text> invited you to <Text style={{ fontFamily: fonts.bodySemi }}>{inv.channel_name}</Text>.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button label="Join" loading={busy === inv.id} onPress={() => act(inv.id, () => api.respondInvite(inv.id, true))} style={{ flex: 1, height: 44 }} />
              <Button label="Decline" variant="secondary" disabled={busy === inv.id} onPress={() => act(inv.id, () => api.respondInvite(inv.id, false))} style={{ flex: 1, height: 44 }} />
            </View>
          </View>
        ))}
        {mine.length === 0 && data.invites.length === 0 ? <State empty="Nothing here yet. Start a private channel with the plus button, or wait for an invitation." /> : null}
        {mine.map((c) => {
          const ends = c.kind === 'booking' ? endsIn(data.expiry[c.id] ?? null) : null;
          return (
            <Row key={c.id} left={<LetterBadge name={c.name} />} title={c.name} subtitle={ends ? 'Booking chat. Disappears a day after the game.' : preview(c.id)}
              meta={ends ? ends.toUpperCase() : data.previews[c.id] ? listStamp(data.previews[c.id].last_at) : null} tag={ends} onPress={() => open(c.id)} />
          );
        })}
      </>) : null}

    </Screen>
  );
}
