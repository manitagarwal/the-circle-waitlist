import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PersonAvatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { ArchBadge, Row, Segmented, State, TabHeader } from '@/components/lists';
import { Info } from '@/components/Info';
import { Screen } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { listStamp } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';

type Seg = 'friends' | 'groups' | 'strangers';

export default function Messages() {
  const r = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [seg, setSeg] = useState<Seg>('friends');
  useEffect(() => { if (tab === 'groups') setSeg('groups'); }, [tab]);

  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [dms, channels, previews] = await Promise.all([api.dms(), api.channels(), api.channelPreviews()]);
    const prev = Object.fromEntries(previews.map((p) => [p.channel_id, p]));
    const groups = channels.filter((c) => c.kind === 'private' && c.is_member)
      .sort((a, b) => (prev[b.id]?.last_at ?? b.created_at).localeCompare(prev[a.id]?.last_at ?? a.created_at));
    return { dms, groups, prev };
  });
  const dmRows = (data?.dms ?? []).filter((d) => d.tab === (seg === 'strangers' ? 'strangers' : 'friends')).sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''));

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Messages" right={seg !== 'groups' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Find people" onPress={() => r.push('/people')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="search" /></Pressable>) : seg === 'groups' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="New group" onPress={() => r.push('/group/new')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" color={colors.inkOn} strokeWidth={2.2} /></Pressable>) : undefined} />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'friends', label: 'Friends' }, { value: 'groups', label: 'Groups' }, { value: 'strangers', label: 'Strangers' }]} />
      <State loading={loading} error={error} onRetry={reload}
        empty={data && seg !== 'groups' && dmRows.length === 0 ? (seg === 'friends' ? 'No conversations with friends yet.' : 'No messages from strangers.') : data && seg === 'groups' && data.groups.length === 0 ? 'No groups yet. Start one with the plus button and add your friends.' : null} />

      {seg === 'groups' ? data?.groups.map((g) => (
        <Row key={g.id} left={<ArchBadge name={g.name} />} title={g.name} meta={data.prev[g.id] ? listStamp(data.prev[g.id].last_at) : null}
          subtitle={data.prev[g.id] ? `${data.prev[g.id].from_me ? 'You' : data.prev[g.id].sender_username ?? 'Someone'}: ${data.prev[g.id].body}` : `${g.member_count} members`}
          onPress={() => r.push({ pathname: '/channel/[id]', params: { id: g.id } })} />
      )) : dmRows.map((d) => (
        <Row key={d.channel_id} left={<PersonAvatar person={d} />} title={d.username} meta={d.last_at ? listStamp(d.last_at) : null}
          subtitle={d.last_body ? `${d.last_from_me ? 'You: ' : ''}${d.last_body}` : null}
          onPress={() => r.push({ pathname: '/dm/[id]', params: { id: d.other_id } })} />
      ))}
      <Info text={seg === 'groups' ? 'Groups are for friends only. You can add up to 50 people, and anyone can leave.' : 'Message anyone from their profile. Strangers get one message until they accept you as a friend.'} style={{ alignSelf: 'center', marginTop: 20 }} />
    </Screen>
  );
}
