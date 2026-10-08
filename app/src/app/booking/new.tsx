import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Chip, Row, Sheet, State } from '@/components/lists';
import { Body, Button, Notice, Stepper, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { bookingDay, startSlots } from '@/lib/bookings';
import { clock } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';

const DURATIONS = [{ label: '1 hour', mins: 60 }, { label: '1.5 hours', mins: 90 }, { label: '2 hours', mins: 120 }, { label: '3 hours', mins: 180 }];
const AGES: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Any age', min: null, max: null }, { label: '18 to 25', min: 18, max: 25 }, { label: '25 to 35', min: 25, max: 35 },
  { label: '35 to 45', min: 35, max: 45 }, { label: '45 and over', min: 45, max: null },
];
const RELIABLE_SCORE = 7.0; // the "full privileges" score threshold

export default function NewBooking() {
  const r = useRouter();
  const [interest, setInterest] = useState<{ id: number; name: string } | null>(null);
  const [pick, setPick] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const slots = useMemo(() => startSlots(), []);
  const days = useMemo(() => [...new Set(slots.map((s) => bookingDay(s)))], [slots]);
  const [day, setDay] = useState<string>(days[0] ?? '');
  const [start, setStart] = useState<string | null>(null);
  const [dur, setDur] = useState(120);
  const [venue, setVenue] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [people, setPeople] = useState(4);
  const [age, setAge] = useState(0);
  const [mixOn, setMixOn] = useState(false);
  const [men, setMen] = useState(2);
  const [women, setWomen] = useState(2);
  const [reliable, setReliable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const groups = useLoad(() => api.interestGroups());
  const mine = useLoad(async () => {
    const m = (await api.bookingsMine()).filter((b) => b.is_host && b.kind === 'member');
    return { open: m.filter((b) => (b.status === 'open' || b.status === 'full') && new Date(b.ends_at) > new Date()).length, today: m.filter((b) => Date.parse(b.created_at) > Date.now() - 86400000).length };
  });

  const end = start ? new Date(new Date(start).getTime() + dur * 60000).toISOString() : null;
  const headcount = mixOn ? men + women : people;
  const ready = !!interest && title.trim().length >= 3 && !!start && venue.trim() && area.trim() && address.trim() && headcount >= 2;

  const post = async () => {
    if (!interest || !start || !end) return;
    setBusy(true); setErr(null);
    try {
      const id = await api.createBooking({
        interestId: interest.id, title: title.trim(), description: desc.trim() || null, venue: venue.trim(), area: area.trim(), address: address.trim(),
        startsAt: start, endsAt: end, headcountMax: headcount, maleSlots: mixOn ? men : null, femaleSlots: mixOn ? women : null,
        minScore: reliable ? RELIABLE_SCORE : null, ageMin: AGES[age].min, ageMax: AGES[age].max,
      });
      r.replace({ pathname: '/booking/[id]', params: { id } });
    } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };

  const label = (t: string) => <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 18, marginBottom: 6 }}>{t}</Text>;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Host a booking" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {label('Activity')}
        <Button label={interest?.name ?? 'Choose an activity'} variant="secondary" onPress={() => setPick(true)} />
        <TextField label="Title" value={title} onChangeText={setTitle} maxLength={80} />

        {label('When')}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{days.map((d) => <Chip key={d} label={d === 'Tonight' ? 'Today' : d} on={day === d} onPress={() => { setDay(d); setStart(null); }} />)}</ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {slots.filter((s) => bookingDay(s) === day).map((s) => <Chip key={s} label={clock(new Date(s))} on={start === s} onPress={() => setStart(s)} />)}
        </ScrollView>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>Start on the hour or half hour, 6 to 24 hours from now.</Text>
        {label('How long')}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{DURATIONS.map((d) => <Chip key={d.mins} label={d.label} on={dur === d.mins} onPress={() => setDur(d.mins)} />)}</ScrollView>
        {start && end ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 8 }}>{clock(new Date(start))} to {clock(new Date(end))}</Text> : null}

        <TextField label="Where: venue" value={venue} onChangeText={setVenue} placeholder="For example: Play-A-Shot" />
        <TextField label="Area" value={area} onChangeText={setArea} placeholder="For example: Sector 43, Gurgaon" hint="Everyone sees the venue and area." />
        <TextField label="Exact address" value={address} onChangeText={setAddress} hint="Only people who join see this." />

        {label('People')}
        {mixOn ? <Body style={{ fontSize: 14 }}>{men + women} in total, including you.</Body> : <Stepper label="People, including you" value={people} min={2} max={30} onChange={setPeople} />}
        {label('Age range')}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{AGES.map((a, i) => <Chip key={a.label} label={a.label} on={age === i} onPress={() => setAge(i)} />)}</ScrollView>
        {label('Gender mix')}
        <View style={{ flexDirection: 'row' }}><Chip label="Anyone" on={!mixOn} onPress={() => setMixOn(false)} /><Chip label="Set the mix" on={mixOn} onPress={() => setMixOn(true)} /></View>
        {mixOn ? <><Stepper label="Men, including you if you are one" value={men} min={0} max={15} onChange={setMen} /><Stepper label="Women, including you if you are one" value={women} min={0} max={15} onChange={setWomen} /></> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Reliable members only</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Hides your booking from members with a low reliability score.</Text>
          </View>
          <Switch accessibilityLabel="Reliable members only" value={reliable} onValueChange={setReliable} trackColor={{ true: colors.gold, false: colors.line }} thumbColor="#ffffff" />
        </View>
        <TextField label="Anything else? (optional)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 88, paddingTop: 12, textAlignVertical: 'top' }} />

        {mine.data ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 20 }}>{mine.data.open} of 2 bookings open. {Math.max(0, 3 - mine.data.today)} of 3 left to post today.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Post booking" onPress={post} loading={busy} disabled={!ready} style={{ marginTop: 16 }} />
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
