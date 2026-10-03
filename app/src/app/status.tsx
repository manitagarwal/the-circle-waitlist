import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { applicationCode, isApplicationCode } from '@/lib/validators';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';

const COPY: Record<string, { label: string; body: string }> = {
  pending: { label: 'Under review', body: "A person is reading it. You're near the front." },
  accepted: { label: 'Accepted', body: 'Your invitation code is in your inbox. Tap “I have an invitation code” on the welcome screen.' },
  rejected: { label: 'Not this time', body: "We couldn't make room for this application." },
  declined: { label: 'Not this time', body: "We couldn't make room for this application." },
};

export default function Status() {
  const r = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ full_name: string; status: string } | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const check = async () => {
    setBusy(true); setErr(null);
    try { setRes(await api.applicationStatus(code)); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  const c = res ? COPY[res.status] ?? COPY.pending : null;
  return (
    <Screen>
      <BackButton />
      <Title>Where do I stand?</Title>
      <Body style={{ marginTop: 10 }}>Enter the application ID you were given.</Body>
      <TextField label="Application ID" value={code} onChangeText={(v) => setCode(applicationCode(v))} autoCapitalize="characters" autoCorrect={false} maxLength={8}
        style={{ fontFamily: fonts.title, letterSpacing: 3 }} error={err} onSubmitEditing={check} />
      <Button label="Check" onPress={check} loading={busy} disabled={!isApplicationCode(code)} style={{ marginTop: 20 }} />
      {res === null ? <Notice tone="plain">We can't find that ID. Check it and try again.</Notice> : null}
      {res && c ? (
        <View style={{ marginTop: 24, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 16 }}>
          <Text style={{ fontFamily: fonts.title, fontSize: 20, color: colors.ink }}>{res.full_name}</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.goldText, marginTop: 4 }}>{c.label}</Text>
          <Body style={{ marginTop: 8 }}>{c.body}</Body>
        </View>
      ) : null}
      {res?.status === 'accepted' ? <Button label="I have my code" onPress={() => r.replace('/join')} style={{ marginTop: 16 }} /> : null}
    </Screen>
  );
}
