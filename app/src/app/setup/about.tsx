import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Body, Button, Screen, StepHeader, TextField, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { ageOn, GENDERS, MIN_AGE, parseDob } from '@/lib/profile';
import { useSetup } from './_layout';

type Errs = Partial<Record<'dob' | 'gender' | 'address' | 'area' | 'field', string>>;

export default function About() {
  const r = useRouter();
  const { s, set } = useSetup();
  const [errs, setErrs] = useState<Errs>({});
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);

  const locate = async () => {
    setLocNote(null); setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setLocNote('Location is off. Type your address instead.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const patch: Partial<typeof s> = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try {
        const [g] = await Location.reverseGeocodeAsync(pos.coords);
        if (g) {
          patch.address = [g.name, g.street, g.district, g.city].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');
          patch.area = [g.district || g.subregion, g.city].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');
        }
      } catch { /* no address lookup here: keep the coordinates, ask for the text */ }
      set(patch);
      if (!patch.address) setLocNote('Got your location. Add your address and area below.');
    } catch { setLocNote("Couldn't get your location. Type your address instead."); } finally { setLocating(false); }
  };

  const next = () => {
    const e: Errs = {};
    const dob = parseDob(s.dobD, s.dobM, s.dobY);
    if (!dob) e.dob = 'Enter a real date, like 05 03 1994.';
    else if (ageOn(dob) < MIN_AGE) e.dob = `You must be ${MIN_AGE} or over.`;
    if (!s.gender) e.gender = 'Pick an option.';
    if (!s.address.trim()) e.address = 'Tell us where you live.';
    if (!s.area.trim()) e.area = 'Add the area others will see.';
    if (!s.field.trim()) e.field = 'Add your field of work.';
    setErrs(e);
    if (!Object.keys(e).length) r.push('/setup/notifications');
  };

  const dobBox = (label: string, ph: string, v: string, key: 'dobD' | 'dobM' | 'dobY', max: number) => (
    <TextField label={label} placeholder={ph} value={v} onChangeText={(t) => set({ [key]: t.replace(/\D/g, '').slice(0, max) } as never)}
      keyboardType="number-pad" maxLength={max} style={{ textAlign: 'center' }} accessibilityLabel={`Date of birth, ${label}`} />
  );

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={next} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={3} of={4} />
      <Title italic>A little about you.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Name, work email and LinkedIn came with your application. Nothing to retype.</Body>

      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 20 }}>Date of birth</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>{dobBox('Day', 'DD', s.dobD, 'dobD', 2)}</View>
        <View style={{ flex: 1 }}>{dobBox('Month', 'MM', s.dobM, 'dobM', 2)}</View>
        <View style={{ flex: 1.6 }}>{dobBox('Year', 'YYYY', s.dobY, 'dobY', 4)}</View>
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: errs.dob ? colors.error : colors.faint, marginTop: 6 }}>
        {errs.dob ?? 'Others see your age, never the date. You must be 18 or over.'}
      </Text>

      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 20 }}>Gender</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {GENDERS.map((g) => {
          const on = s.gender === g.value;
          return (
            <Pressable key={g.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => set({ gender: g.value })}
              style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.control, borderWidth: 1, borderColor: on ? colors.goldText : colors.line, backgroundColor: on ? colors.goldTint : colors.card }}>
              <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 14, color: colors.ink }}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: errs.gender ? colors.error : colors.faint, marginTop: 6 }}>
        {errs.gender ?? 'Used for bookings that ask for a gender mix. Never shown on your profile.'}
      </Text>

      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, marginTop: 24 }}>Where you live</Text>
      <Button label="Use my current location" variant="secondary" onPress={locate} loading={locating} style={{ marginTop: 8 }} />
      {locNote ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 8 }}>{locNote}</Text> : null}
      <TextField label="Address" value={s.address} onChangeText={(v) => set({ address: v })} autoComplete="street-address" error={errs.address} />
      <TextField label="Area others will see" value={s.area} onChangeText={(v) => set({ area: v })} error={errs.area} hint="For example: Sector 56, Gurgaon. Others see only the area, not the address." />

      <TextField label="Field of work" value={s.field} onChangeText={(v) => set({ field: v })} error={errs.field} />
    </Screen>
  );
}
