import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Screen, StepHeader, TextField, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { CITIES } from '@/lib/config';
import { isEmail, isLinkedIn, isPersonalEmail, normalizePhone } from '@/lib/validators';
import { api } from '@/lib/auth';
import { cityValue, useApply } from './_layout';

type Errs = Partial<Record<'fullName' | 'phone' | 'city' | 'personalEmail' | 'linkedin', string>>;

export default function Details() {
  const r = useRouter();
  const { s, set } = useApply();
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);

  const next = async () => {
    const e: Errs = {};
    if (s.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
    if (!normalizePhone(s.phone)) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (!s.city) e.city = 'Pick your city.';
    else if (!cityValue(s)) e.city = 'Type your city.';
    if (!isEmail(s.personalEmail)) e.personalEmail = 'Enter a valid email address.';
    if (!isLinkedIn(s.linkedin)) e.linkedin = 'Paste your LinkedIn profile link.';
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const d = await api.checkDuplicates({ phone: s.phone, personalEmail: s.personalEmail });
      const dup: Errs = {};
      if (d.phone) dup.phone = 'This phone number has already applied.';
      if (d.personal_email && !s.personalVerified) dup.personalEmail = 'This email has already applied. Go back and log in, or tap "Forgot, or haven\'t set a password?".';
      setErrs(dup);
      if (!Object.keys(dup).length) r.push('/apply/verify');
    } catch { setErrs({ fullName: "Can't reach the server. Check your connection." }); }
    finally { setBusy(false); }
  };

  return (
    <Screen footer={<Button label="Continue" onPress={next} loading={busy} />}>
      <StepHeader step={1} of={5} />
      <Title italic>Request an invitation.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Four short steps. Read by people, not a model.</Body>
      <TextField label="Full name" value={s.fullName} onChangeText={(v) => set({ fullName: v })} autoComplete="name" error={errs.fullName} />
      <TextField label="Phone number" value={s.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" autoComplete="tel" error={errs.phone} />
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 6 }}>City</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CITIES.map((c) => {
            const on = s.city === c;
            return (
              <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => set({ city: c })}
                style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.control, borderWidth: 1, borderColor: on ? colors.goldText : colors.line, backgroundColor: on ? colors.goldTint : colors.card }}>
                <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 14, color: colors.ink }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: errs.city ? colors.error : colors.faint, marginTop: 6 }}>
          {errs.city ?? 'Delhi NCR only for now. Elsewhere? Pick Other and we\'ll tell you when we reach you.'}
        </Text>
      </View>
      {s.city === 'Other' ? <TextField label="Your city" value={s.cityOther} onChangeText={(v) => set({ cityOther: v })} autoComplete="off" /> : null}
      <TextField label="Personal email" value={s.personalEmail} onChangeText={(v) => set({ personalEmail: v })} keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        editable={!s.personalVerified} error={errs.personalEmail} hint="This is your login. We'll check it's yours in the next step." />
      <TextField label="LinkedIn URL" value={s.linkedin} onChangeText={(v) => set({ linkedin: v })} keyboardType="url" autoCapitalize="none" placeholder="https://linkedin.com/in/yourname" error={errs.linkedin} />
    </Screen>
  );
}
