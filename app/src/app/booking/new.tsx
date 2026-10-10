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
import { closeLabel } from '@/lib/bookings';
import type { BookingLimits } from '@/lib/api';
import { clampDuration, type Clock12, DURATION_STEP, durationLabel, istToIso, MIN_DURATION, startError, todayIST, type YMD, ymdLabel, clockLabel } from '@/lib/schedule';
import { clock } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';
import { Info } from '@/components/Info';

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
  const [limits, setLimits] = useState<BookingLimits | null>(null);
  const [closeH, setCloseH] = useState<number | null>(null);
  const [win, setWin] = useState({ min: 6, max: 24 });
  const [venue, setVenue] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [people, setPeople] = useState(4);
  const [ageMinT, setAgeMinT] = useState('');
  const [ageMaxT, setAgeMaxT] = useState('');
  const [mixOn, setMixOn] = useState(false);
  const [men, setMen] = useState(2);
  const [women, setWomen] = useState(2);
  const [minScoreT, setMinScoreT] = useState('');
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
    void api.bookingLimits(a.id).then((l) => { setLimits(l); setCloseH(l.close_hours); setPeople((p) => Math.min(p, l.max_people)); setMen(0); setWomen(0); });
  };
  const num = (s: string) => (s.trim() === '' ? null : Number(s.trim().replace(',', '.')));
  const ageMin = num(ageMinT), ageMax = num(ageMaxT), minScore = num(minScoreT);
  const ageErr = (ageMin != null && (!Number.isInteger(ageMin) || ageMin < 18 || ageMin > 99)) || (ageMax != null && (!Number.isInteger(ageMax) || ageMax < 18 || ageMax > 99))
    ? 'Ages are whole numbers from 18 to 99.' : ageMin != null && ageMax != null && ageMax < ageMin ? 'The maximum age can’t be below the minimum.' : null;
  const scoreErr = minScore != null && (Number.isNaN(minScore) || minScore < 0 || minScore > 10) ? 'Reliability is a number from 0 to 10.' : null;
  const headcount = mixOn ? men + women : people;
  const ready = !!interest && title.trim().length >= 3 && !!start && !startErr && venue.trim() && area.trim() && address.trim() && headcount >= 2 && !ageErr && !scoreErr;

  const post = async () => {
    if (!interest || !start || !end) return;
    setBusy(true); setErr(null);
    try {
      const id = await api.createBooking({
        interestId: interest.id, title: title.trim(), description: desc.trim() || null, venue: venue.trim(), area: area.trim(), address: address.trim(),
        startsAt: start, endsAt: end, headcountMax: headcount, maleSlots: mixOn ? men : null, femaleSlots: mixOn ? women : null,
        minScore, ageMin, ageMax,
      });
      if (limits && closeH != null && closeH > limits.close_hours) await api.setBookingCloseHours(id, closeH).catch(() => {});
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

        {label(limits ? `People, up to ${limits.max_people} for ${interest?.name ?? 'this activity'}` : 'People')}
        {mixOn ? <Body style={{ fontSize: 14 }}>{men + women} in total, including you.</Body> : <Stepper label="People, including you" value={people} min={2} max={limits?.max_people ?? 30} onChange={setPeople} />}
        {label('Age range')}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><TextField label="Youngest (optional)" value={ageMinT} onChangeText={(v) => setAgeMinT(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="Any" /></View>
          <View style={{ flex: 1 }}><TextField label="Oldest (optional)" value={ageMaxT} onChangeText={(v) => setAgeMaxT(v.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="Any" /></View>
        </View>
        {ageErr ? <Body style={{ fontSize: 13 }}>{ageErr}</Body> : null}
        {label('Gender mix')}
        <View style={{ flexDirection: 'row' }}><Chip label="Anyone" on={!mixOn} onPress={() => setMixOn(false)} /><Chip label="Set the mix" on={mixOn} onPress={() => setMixOn(true)} /></View>
        {mixOn ? <><Stepper label="Men, including you if you are one" value={men} min={0} max={Math.max(0, (limits?.max_people ?? 30) - women)} onChange={setMen} /><Stepper label="Women, including you if you are one" value={women} min={0} max={Math.max(0, (limits?.max_people ?? 30) - men)} onChange={setWomen} /></> : null}

        {limits ? (<>
          {label('Joining closes')}
          <ChipRow>{[limits.close_hours, ...[3, 4, 6, 12, 24, 48, 72, 168].filter((h) => h > limits.close_hours)].map((h) => <Chip key={h} label={closeLabel(h, h === limits.close_hours)} on={closeH === h} onPress={() => setCloseH(h)} />)}</ChipRow>
        </>) : null}
        {label('Minimum reliability')}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <View style={{ flex: 1 }}><TextField label="Lowest score that can join (optional)" value={minScoreT} onChangeText={(v) => setMinScoreT(v.replace(/[^0-9.,]/g, '').slice(0, 4))} keyboardType="decimal-pad" placeholder="Anyone" /></View>
          <Info text="Only members whose reliability score is at or above this can join your booking. Scores go from 0 to 10. Leave empty to let anyone join." title="Minimum reliability" />
        </View>
        {scoreErr ? <Body style={{ fontSize: 13 }}>{scoreErr}</Body> : null}
        <TextField label="Anything else? (optional)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 88, paddingTop: 12, textAlignVertical: 'top' }} />

        {mine.data ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 20 }}>{mine.data.open} of 2 bookings open. {Math.max(0, 3 - mine.data.today)} of 3 left to post today.</Text> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Post booking" onPress={post} loading={busy} disabled={!ready} style={{ marginTop: 16 }} />
      </ScrollView>

      <DatePickerSheet visible={pickDate} value={date} onClose={() => setPickDate(false)} onPick={setDate} />
      <TimePickerSheet key={String(pickTime)} visible={pickTime} value={clockVal} onClose={() => setPickTime(false)} onPick={setClockVal} />
      <ActivityPicker bookableOnly visible={pick} onClose={() => setPick(false)} selectedId={interest?.id} onPick={chooseActivity} />
    </View>
  );
}
