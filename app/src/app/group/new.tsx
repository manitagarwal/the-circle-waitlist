import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { FriendPicker } from '@/components/FriendPicker';
import { State } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { colors } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { GROUP_MAX_MEMBERS, spotsLeft } from '@/lib/groups';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';
import { Info } from '@/components/Info';

export default function NewGroup() {
  const r = useRouter();
  const { member } = useAuth();
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data: friends, error, loading, reload } = useLoad(() => api.friends(member!.id));

  const nameOk = name.trim().length >= 3 && name.trim().length <= 50;
  const create = async () => {
    setBusy(true); setErr(null);
    try {
      const id = await api.createGroup(name.trim(), picked);
      r.replace({ pathname: '/channel/[id]', params: { id } });
    } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="New group" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Info text={"A casual chat for you and your friends. Friends you add join straight away, and anyone can leave whenever they like."} />
        <TextField label="Group name" value={name} onChangeText={setName} maxLength={50} error={name && !nameOk ? 'Use 3 to 50 characters.' : null} />
        <State loading={loading} error={error} onRetry={reload} />
        {friends ? <FriendPicker friends={friends} selected={picked} max={spotsLeft(1, 0, GROUP_MAX_MEMBERS)} onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} /> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label={`Create group${picked.length ? ` with ${picked.length}` : ''}`} onPress={create} loading={busy} disabled={!nameOk || picked.length < 1} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}
