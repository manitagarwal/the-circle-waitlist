import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { InterestPicker } from '@/components/InterestPicker';
import { State } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { INTERESTS_MAX, INTERESTS_MIN } from '@/lib/profile';

export default function EditInterests() {
  const r = useRouter();
  const [ids, setIds] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.ownRow().then((o) => setIds(o.interestIds)).catch((e) => setErr(friendly(e))); }, []);
  const save = async () => { setBusy(true); setErr(null); try { await api.saveProfile({ interestIds: ids! }); r.back(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); } };
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Interests" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Body style={{ fontSize: 14 }}>Pick {INTERESTS_MIN} to {INTERESTS_MAX}. Your Lobbies follow your interests.</Body>
        {ids ? <InterestPicker selected={ids} onChange={setIds} /> : <State loading={!err} error={err} />}
        {ids && err ? <Notice tone="error">{err}</Notice> : null}
        {ids ? <Button label="Save interests" onPress={save} loading={busy} disabled={ids.length < INTERESTS_MIN} style={{ marginTop: 24 }} /> : null}
      </ScrollView>
    </View>
  );
}
