import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { PersonAvatar } from '@/components/Avatar';
import { Row, Segmented, State, TabHeader } from '@/components/lists';
import { Screen } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { listStamp } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';

export default function Messages() {
  const r = useRouter();
  const [seg, setSeg] = useState<'friends' | 'strangers'>('friends');
  const { data, error, loading, refreshing, pull, reload } = useLoad(() => api.dms());
  const rows = (data ?? []).filter((d) => d.tab === seg).sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''));

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Messages" />
      <Segmented value={seg} onChange={setSeg} options={[{ value: 'friends', label: 'Friends' }, { value: 'strangers', label: 'Strangers' }]} />
      <State loading={loading} error={error} onRetry={reload} empty={data && rows.length === 0 ? (seg === 'friends' ? 'No conversations with friends yet.' : 'No messages from strangers.') : null} />
      {rows.map((d) => (
        <Row key={d.channel_id} left={<PersonAvatar person={d} />} title={d.username} meta={d.last_at ? listStamp(d.last_at) : null}
          subtitle={d.last_body ? `${d.last_from_me ? 'You: ' : ''}${d.last_body}` : null}
          onPress={() => r.push({ pathname: '/dm/[id]', params: { id: d.other_id } })} />
      ))}
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, textAlign: 'center', marginTop: 20 }}>Message anyone from their profile. Strangers get one message until they accept you as a friend.</Text>
    </Screen>
  );
}
