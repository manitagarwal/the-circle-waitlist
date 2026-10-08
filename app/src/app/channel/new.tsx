import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityPicker } from '@/components/ActivityPicker';
import { Bar } from '@/components/Bar';
import { Chip, Row, Segmented, Sheet } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { ageError, CHANNEL_CITIES } from '@/lib/channels';
import { GENDERS } from '@/lib/profile';
import { useLoad } from '@/lib/useLoad';

export default function NewChannel() {
  const r = useRouter();
  const { member } = useAuth();
  const [kind, setKind] = useState<'public' | 'private'>('public');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState<{ id: number; name: string } | null>(null);
  const [pickActivity, setPickActivity] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [pickCity, setPickCity] = useState(false);
  const [area, setArea] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mine = useLoad(async () => (await api.channels()).filter((c) => c.created_by === member?.id && (c.kind === 'public' || c.kind === 'private')).length);

  const nameOk = name.trim().length >= 3 && name.trim().length <= 50;
  const ageErr = ageError(ageMin, ageMax);
  const ready = nameOk && !ageErr && (kind === 'private' || (!!interest && !!city));
  const create = async () => {
    setBusy(true); setErr(null);
    try {
      const id = await api.createChannel({
        kind, name: name.trim(), interestId: interest?.id ?? null,
        tags: { ...(city ? { city } : {}), ...(area.trim() ? { area: area.trim() } : {}), ...(ageMin.trim() ? { age_min: ageMin.trim() } : {}), ...(ageMax.trim() ? { age_max: ageMax.trim() } : {}), ...(gender ? { gender } : {}) },
      });
      r.replace({ pathname: '/channel/[id]', params: { id } });
    } catch (e) {
      const m = String((e as Error)?.message ?? '');
      setErr(/city_required/.test(m) ? 'Pick a city.' : /interest_required/.test(m) ? 'Pick an activity.' : /age_invalid/.test(m) ? 'Check the ages. They run from 18 to 99.' : friendly(e));
    } finally { setBusy(false); }
  };

  const label = (t: string) => <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 18, marginBottom: 6 }}>{t}</Text>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="New channel" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Segmented value={kind} onChange={setKind} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
        <Body style={{ fontSize: 14 }}>{kind === 'public' ? 'Anyone can join. You own it.' : 'Invite only. Your circle.'}</Body>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={50} error={name && !nameOk ? 'Use 3 to 50 characters.' : null} />

        {label(`Activity${kind === 'private' ? ' (optional)' : ''}`)}
        <Button label={interest?.name ?? 'Choose an activity'} variant="secondary" onPress={() => setPickActivity(true)} />

        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 28 }}>Where</Text>
        {label(`City${kind === 'private' ? ' (optional)' : ''}`)}
        <Button label={city ?? 'Choose a city'} variant="secondary" onPress={() => setPickCity(true)} />
        <TextField label="Area (optional)" value={area} onChangeText={setArea} maxLength={60} placeholder="For example: Sector 43" />

        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 28 }}>Who it's for</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><TextField label="Youngest (optional)" value={ageMin} onChangeText={(v) => setAgeMin(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="18" /></View>
          <View style={{ flex: 1 }}><TextField label="Oldest (optional)" value={ageMax} onChangeText={(v) => setAgeMax(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="99" /></View>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ageErr ? colors.error : colors.faint, marginTop: 6 }}>{ageErr ?? 'Leave both empty for all ages.'}</Text>
        {label('Gender')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
          <Chip label="Anyone" on={gender == null} onPress={() => setGender(null)} />
          {GENDERS.map((g) => <Chip key={g.value} label={g.label} on={gender === g.value} onPress={() => setGender(g.value)} />)}
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>These tags help the right people find the channel. They don't lock anyone out.</Text>

        {mine.data != null ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 24 }}>{mine.data} of 2 channels open. Get one channel to 50 members and you can open a third.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Create channel" onPress={create} loading={busy} disabled={!ready} style={{ marginTop: 20 }} />
      </ScrollView>

      <ActivityPicker visible={pickActivity} onClose={() => setPickActivity(false)} selectedId={interest?.id} onPick={(a) => { setInterest(a); setPickActivity(false); }} />
      <Sheet visible={pickCity} onClose={() => setPickCity(false)} title="City">
        <ScrollView>
          {CHANNEL_CITIES.map((c) => <Row key={c} title={c} right={city === c ? <Text style={{ color: colors.sage, fontFamily: fonts.bodySemi }}>✓</Text> : undefined} onPress={() => { setCity(c); setPickCity(false); }} />)}
        </ScrollView>
      </Sheet>
    </View>
  );
}
