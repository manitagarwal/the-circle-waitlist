import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Screen, TextField, Title } from '@/components/ui';
import { isEmail, normalizeEmail, isPersonalEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';

export default function Join() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    if (isPersonalEmail(email)) return setErr('That looks like a personal inbox. Use your work or business email.');
    setBusy(true); setErr(null);
    try {
      await api.sendCode(email, true);
      r.push({ pathname: '/code', params: { email: normalizeEmail(email), mode: 'join' } });
    } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <BackButton />
      <Title>Sign in with your work email.</Title>
      <Body style={{ marginTop: 10 }}>We'll send a six-digit code to the address you applied with. First time in? Same thing.</Body>
      <TextField label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err}
        hint="Use your work or business email. Personal inboxes like Gmail won't work." onSubmitEditing={send} />
      <Button label="Send me a code" onPress={send} loading={busy} style={{ marginTop: 24 }} />
    </Screen>
  );
}
