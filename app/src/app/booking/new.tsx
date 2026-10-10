import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { ActivityPicker } from '@/components/ActivityPicker';
import { ChipRow } from '@/components/ChipRow';
import { Chip } from '@/components/lists';
import { DatePickerSheet, TimePickerSheet } from '@/components/Pickers';
import { Body, Button, Notice, Stepper, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { clampDuration, type Clock12, DURATION_STEP, durationLabel, istToIso, MIN_DURATION, startError, todayIST, type YMD, ymdLabel, clockLabel } from '@/lib/schedule';
import { clock } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';
import { Info } from '@/components/Info';

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
  const [date, setDate] = useState<YMD | null>(null);
  const [clockVal, setClockVal] = useState<Clock12 | null>(null);
  const [pickDate, setPickDate] = useState(false);
  const [pickTime, setPickTime] = useState(false);
  const [dur, setDur] = useState(60);
  const [maxDur, setMaxDur] = useState(360);
  const [win, setWin] = useState({ min: 6, max: 24 });
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

  const mine = useLoad(async () => {
    const m = (await api.bookingsMine()).filter((b) => b.is_host && b.kind === 'member');
    return { open: m.filter((b) => (b.status === 'open' || b.status === 'full') && new Date(b.ends_at) > new Date()).length, today: m.filter((b) => Date.parse(b.created_at) > Date.now() - 86400000).length };
  });

  const start = date && clockVal ? istToIso(date, clockVal) : null;
  const end = start ? new Date(new Date(start).getTime() + dur * 60000).toISOString() : null;
  const startErr = startError(start, new Date(), win.min, win.max);
  const chooseActivity = (a: { id: number; name: string }) => {
    setInterest(a); setPick(false);
    void api.bookingMaxDuration(a.id).then((m) => { setMaxDur(m); setDur((d) => clampDuration(d, m)); });
    void api.bookingWindow(a.id).then(setWin);
  };
  const headcount = mixOn ? men + women : people;
  const ready = !!interest && title.trim().length >= 3 && !!start && !startErr && venue.trim() && area.trim() && address.trim() && headcount >= 2;

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

        {label('Date')}
        <Button label={date ? ymdLabel(date) : 'Choose a date'} variant="secondary" onPress={() => setPickDate(true)} />
        {label('Start time')}
        <Button label={clockVal ? clockLabel(clockVal) : 'Choose a time'} variant="secondary" onPress={() => setPickTime(true)} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: startErr ? colors.error : colors.faint, marginTop: 6 }}>
          {startErr ?? `Start on the hour or half hour, between ${win.min} and ${win.max} hours from now.`}
        </Text>

        {label('How long')}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Shorter" disabled={dur <= MIN_DURATION} onPress={() => setDur((d) => d - DURATION_STEP)}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: dur <= MIN_DURATION ? 0.4 : 1 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 22, color: colors.ink }}>−</Text></Pressable>
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.titleMedium, fontSize: 23, color: colors.ink }}>{durationLabel(dur)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Longer" disabled={dur >= maxDur} onPress={() => setDur((d) => d + DURATION_STEP)}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: dur >= maxDur ? 0.4 : 1 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 22, color: colors.ink }}>+</Text></Pressable>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>In 30-minute steps, up to {durationLabel(maxDur)}{interest ? ` for ${interest.name}` : ''}.</Text>
        {start && end ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 8 }}>{clock(new Date(start))} to {clock(new Date(end))}{ymdLabel(todayIST(new Date(end))) !== ymdLabel(todayIST(new Date(start))) ? ', next day' : ''}</Text> : null}

        <TextField label="Where: venue" value={venue} onChangeText={setVenue} placeholder="For example: Play-A-Shot" />
        <TextField label="Area" value={area} onChangeText={setArea} placeholder="For example: Sector 43, Gurgaon" hint="Everyone sees the venue and area." />
        <TextField label="Exact address" value={address} onChangeText={setAddress} hint="Only people who join see this." />

        {label('People')}
        {mixOn ? <Body style={{ fontSize: 14 }}>{men + women} in total, including you.</Body> : <Stepper label="People, including you" value={people} min={2} max={30} onChange={setPeople} />}
        {label('Age range')}
        <ChipRow>{AGES.map((a, i) => <Chip key={a.label} label={a.label} on={age === i} onPress={() => setAge(i)} />)}</ChipRow>
        {label('Gender mix')}
        <View style={{ flexDirection: 'row' }}><Chip label="Anyone" on={!mixOn} onPress={() => setMixOn(false)} /><Chip label="Set the mix" on={mixOn} onPress={() => setMixOn(true)} /></View>
        {mixOn ? <><Stepper label="Men, including you if you are one" value={men} min={0} max={15} onChange={setMen} /><Stepper label="Women, including you if you are one" value={women} min={0} max={15} onChange={setWomen} /></> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Reliable members only</Text>
            <Info text={"Hides your booking from members with a low reliability score."} />
          </View>
          <Switch accessibilityLabel="Reliable members only" value={reliable} onValueChange={setReliable} trackColor={{ true: colors.ink, false: colors.lineStrong }} thumbColor={colors.ground} />
        </View>
        <TextField label="Anything else? (optional)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 88, paddingTop: 12, textAlignVertical: 'top' }} />

        {mine.data ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 20 }}>{mine.data.open} of 2 bookings open. {Math.max(0, 3 - mine.data.today)} of 3 left to post today.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Post booking" onPress={post} loading={busy} disabled={!ready} style={{ marginTop: 16 }} />
      </ScrollView>

      <DatePickerSheet visible={pickDate} value={date} onClose={() => setPickDate(false)} onPick={setDate} />
      <TimePickerSheet key={String(pickTime)} visible={pickTime} value={clockVal} onClose={() => setPickTime(false)} onPick={setClockVal} />
      <ActivityPicker visible={pick} onClose={() => setPick(false)} selectedId={interest?.id} onPick={chooseActivity} />
    </View>
  );
}
