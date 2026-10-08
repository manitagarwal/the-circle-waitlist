import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Chip, Row, Segmented, Sheet, State } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { AGE_GROUPS, GENDER_TAGS } from '@/lib/channels';
import { useLoad } from '@/lib/useLoad';

export default function NewChannel() {
  const r = useRouter();
  const { member } = useAuth();
  const [kind, setKind] = useState<'public' | 'private'>('public');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState<{ id: number; name: string } | null>(null);
  const [pick, setPick] = useState(false);
  const [area, setArea] = useState('');
  const [age, setAge] = useState<string>('Any age');
  const [gender, setGender] = useState<string>('Any');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const groups = useLoad(() => api.interestGroups());
  const mine = useLoad(async () => (await api.channels()).filter((c) => c.created_by === member?.id && (c.kind === 'public' || c.kind === 'private')).length);

  const nameOk = name.trim().length >= 3 && name.trim().length <= 50;
  const ready = nameOk && (kind === 'private' || !!interest);
  const create = async () => {
    setBusy(true); setErr(null);
    try {
      const tags: Record<string, string> = {};
      if (area.trim()) tags.area = area.trim();
      if (age !== 'Any age') tags.age_group = age;
      if (gender !== 'Any') tags.gender = gender;
      const id = await api.createChannel({ kind, name: name.trim(), interestId: interest?.id ?? null, tags });
      r.replace({ pathname: '/channel/[id]', params: { id } });
    } catch (e) {
      const m = String((e as Error)?.message ?? '');
      setErr(/channel_limit/.test(m) ? 'You have two channels open. Get one to 50 members and you can open a third.' : /name_invalid/.test(m) ? 'Give it a name of 3 to 50 characters.' : /interest_required/.test(m) ? 'Pick an activity.' : friendly(e));
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="New channel" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Segmented value={kind} onChange={setKind} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
        <Body style={{ fontSize: 14 }}>{kind === 'public' ? 'Anyone can join. You own it.' : 'Invite only. Your circle.'}</Body>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={50} error={name && !nameOk ? 'Use 3 to 50 characters.' : null} />

        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 6 }}>Activity{kind === 'private' ? ' (optional)' : ''}</Text>
        <Button label={interest?.name ?? 'Choose an activity'} variant="secondary" onPress={() => setPick(true)} />

        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 24 }}>Tags, so the right people find it</Text>
        <TextField label="Area" value={area} onChangeText={setArea} placeholder="For example: Gurgaon" />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 6 }}>Age group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{AGE_GROUPS.map((a) => <Chip key={a} label={a} on={age === a} onPress={() => setAge(a)} />)}</ScrollView>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 6 }}>Gender</Text>
        <View style={{ flexDirection: 'row' }}>{GENDER_TAGS.map((g) => <Chip key={g} label={g} on={gender === g} onPress={() => setGender(g)} />)}</View>

        {mine.data != null ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 24 }}>{mine.data} of 2 channels open. Get one channel to 50 members and you can open a third.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Create channel" onPress={create} loading={busy} disabled={!ready} style={{ marginTop: 20 }} />
      </ScrollView>

      <Sheet visible={pick} onClose={() => setPick(false)} title="Activity">
        <ScrollView>
          <State loading={groups.loading} error={groups.error} onRetry={groups.reload} />
          {groups.data?.map((g) => (
            <View key={g.id}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.faint, marginTop: 12 }}>{g.name}</Text>
              {g.interests.map((i) => <Row key={i.id} title={i.name} onPress={() => { setInterest({ id: i.id, name: i.name }); setPick(false); }} />)}
            </View>
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}
