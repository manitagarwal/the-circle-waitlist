import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { Row, State } from '@/components/lists';
import { colors } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { useLoad } from '@/lib/useLoad';

export default function Friends() {
  const r = useRouter();
  const { member } = useAuth();
  const { data, error, loading, reload } = useLoad(() => api.friends(member!.id));
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Friends" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <State loading={loading} error={error} onRetry={reload} empty={data && data.length === 0 ? 'No friends yet. Open someone\'s profile and tap Add friend.' : null} />
        {(data ?? []).map((f) => (
          <Row key={f.id} left={<PersonAvatar person={f} />} title={f.full_name ?? f.username} subtitle={`@${f.username}`} right={<Icon name="chevron" size={18} color={colors.faint} />}
            onPress={() => r.push({ pathname: '/member/[id]', params: { id: f.id } })} />
        ))}
      </ScrollView>
    </View>
  );
}
