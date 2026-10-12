import React, { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Screen, StepHeader, TextField, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import type { City } from '@/lib/api';
import { isEmail, isLinkedIn } from '@/lib/validators';
import { phoneError, validatePhone } from '@/lib/phone';
import { Pill } from '@/components/Pill';
import { PhoneField } from '@/components/PhoneField';
import { api } from '@/lib/auth';
import { cityValue, useApply } from './_layout';
import { Info } from '@/components/Info';
import { NCR_PARTS } from '@/lib/config';

type Errs = Partial<Record<'fullName' | 'phone' | 'city' | 'area' | 'personalEmail' | 'linkedin', string>>;

export default function Details() {
  const r = useRouter();
  const { s, set } = useApply();
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [noted, setNoted] = useState(false);
  const [list, setList] = useState<City[]>([]);
  useEffect(() => { api.cities().then(setList).catch(() => {}); }, []);
  const names: string[] = [...(list.length ? list.map((c) => c.name) : ['Delhi NCR']), 'Other'];
  const notLive = s.city === 'Other' || (!!s.city && list.find((c) => c.name === s.city)?.is_live === false);

  const next = async () => {
    if (notLive) {
      const e: Errs = {};
      if (!cityValue(s)) e.city = 'Type your city.';
      if (!isEmail(s.personalEmail)) e.personalEmail = 'Enter a valid email address.';
      setErrs(e);
      if (Object.keys(e).length) return;
      setBusy(true);
      try { await api.registerCityInterest(s.personalEmail, cityValue(s)); setNoted(true); }
      catch { setErrs({ fullName: "Can't reach the server. Check your connection." }); }
      finally { setBusy(false); }
      return;
    }
    const e: Errs = {};
    if (s.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
    const pe = phoneError(s.dial, s.phone);
    if (pe) e.phone = pe;
    if (!s.city) e.city = 'Pick your city.';
    else if (!cityValue(s)) e.city = 'Type your city.';
    else if (!s.area) e.area = 'Pick where in NCR you are.';
    if (!isEmail(s.personalEmail)) e.personalEmail = 'Enter a valid email address.';
    if (!isLinkedIn(s.linkedin)) e.linkedin = 'Paste your LinkedIn profile link.';
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const d = await api.checkDuplicates({ phone: validatePhone(s.dial, s.phone)!, personalEmail: s.personalEmail });
      const dup: Errs = {};
      if (d.phone) dup.phone = 'This phone number has already applied.';
      if (d.personal_email && !s.personalVerified) dup.personalEmail = 'This email has already applied. Go back and log in, or tap "Forgot, or haven\'t set a password?".';
      setErrs(dup);
      if (!Object.keys(dup).length) r.push('/apply/verify');
    } catch { setErrs({ fullName: "Can't reach the server. Check your connection." }); }
    finally { setBusy(false); }
  };

  if (noted) return (
    <Screen footer={<Button label="Back" variant="secondary" onPress={() => { setNoted(false); set({ city: '', cityOther: '' }); }} />}>
      <Title italic>Not there yet.</Title>
      <Body style={{ marginTop: 8 }}>The Semi Circle is only in Delhi NCR for now. We've noted {cityValue(s)} and will email {s.personalEmail} when we open there.</Body>
    </Screen>
  );

  return (
    <Screen footer={<Button label={notLive ? 'Notify me' : 'Continue'} onPress={next} loading={busy} />}>
      <StepHeader step={1} of={5} />
      <Title italic>Request an invitation.</Title>
      <Info text={"Five short steps. Read by people, not a model."} />
      <TextField label="Full name" value={s.fullName} onChangeText={(v) => set({ fullName: v })} autoComplete="name" error={errs.fullName} />
      <PhoneField dial={s.dial} number={s.phone} onChange={(v) => set({ dial: v.dial, phone: v.number })} error={errs.phone} />
      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted }}>City</Text>
          <Info text="Delhi NCR only for now. Elsewhere? Pick your city and we'll email you when we reach it. You won't join the queue." title="City" size={18} style={{ marginTop: 0 }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {names.map((c) => {
            const on = s.city === c;
            return (
              <Pill key={c} label={c} on={on} onPress={() => set({ city: c })} />
            );
          })}
        </View>
        {errs.city ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.error, marginTop: 6 }}>{errs.city}</Text> : null}
      </View>
      {s.city && !notLive ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: 6 }}>Where in NCR do you live or work?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {NCR_PARTS.map(([v, label]) => <Pill key={v} label={label} on={s.area === v} onPress={() => set({ area: v })} />)}
          </View>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: errs.area ? colors.error : colors.faint, marginTop: 6 }}>{errs.area ?? 'This is how we decide where to open first.'}</Text>
        </View>) : null}
      {s.city === 'Other' ? <TextField label="Your city" value={s.cityOther} onChangeText={(v) => set({ cityOther: v })} autoComplete="off" /> : null}
      {notLive ? <Body style={{ marginTop: 12 }}>We're only in Delhi NCR for now. Add your email below and we'll tell you when we open in your city.</Body> : null}
      <TextField label="Personal email" value={s.personalEmail} onChangeText={(v) => set({ personalEmail: v })} keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        editable={!s.personalVerified} error={errs.personalEmail} hint="This is your login. We'll check it's yours in the next step." />
      {notLive ? null : <TextField label="LinkedIn URL" value={s.linkedin} onChangeText={(v) => set({ linkedin: v })} keyboardType="url" autoCapitalize="none" placeholder="https://linkedin.com/in/yourname" error={errs.linkedin} />}
    </Screen>
  );
}
