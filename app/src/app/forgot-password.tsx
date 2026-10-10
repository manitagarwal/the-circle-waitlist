import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { FadeUp } from '@/components/motion';
import { colors, fonts } from '@/theme';
import { isEmail, normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { Info } from '@/components/Info';

export default function Forgot() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    setBusy(true); setErr(null);
    // Always behave the same: we never reveal whether an address belongs to a member.
    // true: also lets website applicants set up their login
    try { await api.sendCode(email, true); } catch { /* generic on purpose */ }
    setBusy(false);
    r.push({ pathname: '/code', params: { email: normalizeEmail(email), mode: 'reset' } });
  };
  return (
    <Screen footer={<View style={{ gap: 4 }}>
      <Button label="Send code" onPress={send} loading={busy} />
      <Text onPress={() => r.replace('/login')} accessibilityRole="link" style={{ textAlign: 'center', padding: 12, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' }}>Remembered it? Back to log in</Text>
    </View>}>
      <BackButton />
      <FadeUp>
        <View style={{ marginTop: 18 }}>
          <Title>Forgot it? Happens.</Title>
          <Info text={"Enter your personal email, the one you log in with. We'll send a code, and you can set a new password after it."} />
        </View>
      </FadeUp>
      <FadeUp delay={100}>
        <TextField label="Personal email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err} />
        <Notice tone="plain">If that address belongs to a member, a code is on its way. We don't say either way.</Notice>
      </FadeUp>
    </Screen>
  );
}
