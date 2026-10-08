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

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

export default function NewChannel() {
  const r = useRouter();
  const { member } = useAuth();
  const [kind, setKind] = useState<'public' | 'private'>('public');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState<{ id: number; name: string } | null>(null);
  const [pickActivity, setPickActivity] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [pickCity, setPickCity] = useState(false);
  const [area, setArea] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [genders, setGenders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mine = useLoad(async () => (await api.channels()).filter((c) => c.created_by === member?.id && (c.kind === 'public' || c.kind === 'private')).length);

  const isPublic = kind === 'public';
  const nameOk = name.trim().length >= 3 && name.trim().length <= 50;
  const ageErr = isPublic ? ageError(ageMin, ageMax) : null;
  const ready = nameOk && !ageErr && (!isPublic || !!interest);
  const create = async () => {
    setBusy(true); setErr(null);
    try {
      const id = await api.createChannel({
        kind, name: name.trim(), interestId: interest?.id ?? null,
        tags: isPublic ? {
          ...(cities.length ? { city: cities } : {}), ...(area.trim() ? { area: area.trim() } : {}),
          ...(ageMin.trim() ? { age_min: ageMin.trim() } : {}), ...(ageMax.trim() ? { age_max: ageMax.trim() } : {}), ...(genders.length ? { gender: genders } : {}),
        } : {},
      });
      r.replace({ pathname: '/channel/[id]', params: { id } });
    } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };

  const label = (t: string) => <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 18, marginBottom: 6 }}>{t}</Text>;
  const heading = (t: string) => <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 28 }}>{t}</Text>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="New channel" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Segmented value={kind} onChange={setKind} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
        <Body style={{ fontSize: 14 }}>{isPublic ? 'Anyone who fits the rules below can join. You own it.' : 'Invite only. Your circle. Anyone you invite can join.'}</Body>
        <TextField label="Name" value={name} onChangeText={setName} maxLength={50} error={name && !nameOk ? 'Use 3 to 50 characters.' : null} />

        {label(`Activity${isPublic ? '' : ' (optional)'}`)}
        <Button label={interest?.name ?? 'Choose an activity'} variant="secondary" onPress={() => setPickActivity(true)} />

        {isPublic ? (<>
          {heading('Who can join')}
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 4 }}>These are rules. Someone who doesn't match can see the channel but can't join. Leave a rule empty to let everyone in.</Text>

          {label('City')}
          <Button label={cities.length ? cities.join(', ') : 'Pan India (any city)'} variant="secondary" onPress={() => setPickCity(true)} />
          <TextField label="Area (optional, just a label)" value={area} onChangeText={setArea} maxLength={60} placeholder="For example: Sector 43" />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><TextField label="Youngest" value={ageMin} onChangeText={(v) => setAgeMin(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="18" /></View>
            <View style={{ flex: 1 }}><TextField label="Oldest" value={ageMax} onChangeText={(v) => setAgeMax(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="99" /></View>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ageErr ? colors.error : colors.faint, marginTop: 6 }}>{ageErr ?? 'Ages 18 to 99. Leave both empty for all ages.'}</Text>

          {label('Gender')}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
            <Chip label="Anyone" on={genders.length === 0} onPress={() => setGenders([])} />
            {GENDERS.map((g) => <Chip key={g.value} label={g.label} on={genders.includes(g.value)} onPress={() => setGenders((x) => toggle(x, g.value))} />)}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>Pick one or more, or leave it on Anyone.</Text>
        </>) : null}

        {mine.data != null ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 24 }}>{mine.data} of 2 channels open. Get one channel to 50 members and you can open a third.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Create channel" onPress={create} loading={busy} disabled={!ready} style={{ marginTop: 20 }} />
      </ScrollView>

      <ActivityPicker visible={pickActivity} onClose={() => setPickActivity(false)} selectedId={interest?.id} onPick={(a) => { setInterest(a); setPickActivity(false); }} />
      <Sheet visible={pickCity} onClose={() => setPickCity(false)} title="Cities">
        <ScrollView>
          <Body style={{ fontSize: 14, marginBottom: 8 }}>Pick one or more cities. Pick none for Pan India.</Body>
          {CHANNEL_CITIES.map((c) => <Row key={c} title={c} right={cities.includes(c) ? <Text style={{ color: colors.sage, fontFamily: fonts.bodySemi, fontSize: 18 }}>✓</Text> : undefined} onPress={() => setCities((x) => toggle(x, c))} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Button label="Pan India" variant="secondary" onPress={() => setCities([])} style={{ flex: 1 }} />
          <Button label="Done" onPress={() => setPickCity(false)} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </View>
  );
}
