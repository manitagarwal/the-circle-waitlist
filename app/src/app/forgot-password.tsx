import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { isEmail, normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';

export default function Forgot() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    setBusy(true); setErr(null);
    // Always behave the same: we never reveal whether an address belongs to a member.
    try { await api.sendCode(email, false); } catch { /* generic on purpose */ }
    setBusy(false);
    r.push({ pathname: '/code', params: { email: normalizeEmail(email), mode: 'reset' } });
  };
  return (
    <Screen>
      <BackButton />
      <Title>Forgot it? Happens.</Title>
      <Body style={{ marginTop: 10 }}>Enter your work email. We'll send a code, and you can set a new password after it.</Body>
      <TextField label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err} />
      <Notice tone="plain">If that address belongs to a member, a code is on its way. We don't say either way.</Notice>
      <Button label="Send code" onPress={send} loading={busy} style={{ marginTop: 24 }} />
      <Text onPress={() => r.replace('/login')} accessibilityRole="link" style={{ textAlign: 'center', padding: 16, fontFamily: fonts.body, fontSize: 14, color: colors.goldText }}>Remembered it? Back to log in</Text>
    </Screen>
  );
}
