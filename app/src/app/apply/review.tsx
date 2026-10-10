import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { linkedInHandle } from '@/lib/validators';
import { formatPhone, validatePhone } from '@/lib/phone';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { cityValue, useApply } from './_layout';
import { Info } from '@/components/Info';

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
    <Text style={{ width: 110, fontFamily: fonts.body, fontSize: 13, color: colors.faint }}>{k}</Text>
    <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>{v}</Text>
  </View>
);

export default function Review() {
  const r = useRouter();
  const { s } = useApply();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const phone = validatePhone(s.dial, s.phone) ?? `+${s.dial}${s.phone}`;

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await api.submitApplication({ id: s.id, fullName: s.fullName, phone, personalEmail: s.personalEmail, workEmail: s.workEmail, linkedin: s.linkedin, city: cityValue(s), referredByCode: s.referredByCode || undefined }, s.vouches);
      await refresh(); // the account now has an application, so routing moves to the status screen
    } catch (e: any) {
      const m = String(e?.message ?? '');
      setErr(e?.code === '23505'
        ? (/phone/.test(m) ? 'This phone number has already applied.' : /personal_email/.test(m) ? 'This personal email has already applied.' : 'This work email has already applied.')
        : friendly(e));
    } finally { setBusy(false); }
  };

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Submit application" onPress={submit} loading={busy} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={5} of={5} />
      <Title italic>Last look.</Title>
      <Info text={"Check it's all you. You can't edit after you submit."} />
      <View style={{ marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 6 }}>
        <Row k="Name" v={s.fullName} />
        <Row k="Phone" v={formatPhone(phone)} />
        <Row k="Login email" v={s.personalEmail} />
        <Row k="Work email" v={s.workEmail} />
        <Row k="LinkedIn" v={linkedInHandle(s.linkedin) ? `linkedin.com/in/${linkedInHandle(s.linkedin)}` : s.linkedin} />
        <Row k="City" v={cityValue(s)} />
        {s.referredByCode ? <Row k="Referral code" v={s.referredByCode} /> : null}
        {s.vouches.length ? <Row k="Vouching for" v={`${s.vouches.length} ${s.vouches.length === 1 ? 'person' : 'people'}`} /> : null}
      </View>
      <Info text={"We'll tell you if you're in by email or WhatsApp. Applications are reviewed by hand, which takes a little while."} />
      {err ? <Notice tone="error">{err}</Notice> : null}
    </Screen>
  );
}
