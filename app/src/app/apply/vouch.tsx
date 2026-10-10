import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, TextField, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { applicationCode, isApplicationCode, isEmail, normalizePhone } from '@/lib/validators';
import { useApply } from './_layout';

export default function Vouch() {
  const r = useRouter();
  const { s, set } = useApply();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    const n = name.trim();
    if (!n) return setErr('Add their name.');
    const email = isEmail(contact) ? contact.trim().toLowerCase() : undefined;
    const phone = !email && normalizePhone(contact) ? normalizePhone(contact)! : undefined;
    if (!email && !phone) return setErr('Add a valid email or mobile number for them.');
    set({ vouches: [...s.vouches, { name: n, email, phone }] });
    setName(''); setContact(''); setErr(null);
  };

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/apply/review')} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={4} of={5} />
      <Title italic>Know someone who belongs?</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Vouching fast-tracks your application. Vouching for someone who embarrasses us fast-tracks nothing. Entirely optional.</Body>
      <TextField label="Were you referred? Enter their code" value={s.referredByCode} onChangeText={(v) => set({ referredByCode: applicationCode(v) })} autoCapitalize="characters" maxLength={8}
        style={{ fontFamily: fonts.title, letterSpacing: 2 }} error={s.referredByCode && !isApplicationCode(s.referredByCode) ? 'Codes are 8 characters.' : null} />
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginTop: 24 }}>People you're vouching for</Text>
      {s.vouches.map((v, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 12, backgroundColor: colors.surface, borderRadius: radius.card }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{v.name}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{v.email ?? v.phone}</Text>
          </View>
          <Text onPress={() => set({ vouches: s.vouches.filter((_, j) => j !== i) })} accessibilityRole="button" style={{ padding: 10, color: colors.goldText, fontFamily: fonts.bodyMedium }}>Remove</Text>
        </View>
      ))}
      <TextField label="Their name" value={name} onChangeText={setName} />
      <TextField label="Their email or mobile" value={contact} onChangeText={setContact} autoCapitalize="none" error={err} />
      <Button label="Add" variant="secondary" onPress={add} style={{ marginTop: 14 }} />
      <Notice tone="plain">Importing from your contacts is coming soon.</Notice>
    </Screen>
  );
}
