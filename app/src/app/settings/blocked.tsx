import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Row, State } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';

export default function Blocked() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { data, error, loading, reload } = useLoad(() => api.blocked());
  const unblock = async (id: string) => { setBusy(id); setErr(null); try { await api.unblock(id); await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(null); } };
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Blocked members" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Body style={{ fontSize: 14 }}>Blocked members can't see your profile or message you, and you can't see theirs.</Body>
        <State loading={loading} error={error} onRetry={reload} empty={data && data.length === 0 ? "You haven't blocked anyone." : null} />
        {err ? <Notice tone="error">{err}</Notice> : null}
        {data?.map((b) => <Row key={b.id} left={<PersonAvatar person={b} />} title={`@${b.username}`} right={<Button label="Unblock" variant="secondary" loading={busy === b.id} onPress={() => unblock(b.id)} style={{ height: 40, paddingHorizontal: 14 }} />} />)}
      </ScrollView>
    </View>
  );
}
