import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { FadeUp } from '@/components/motion';
import { colors, fonts } from '@/theme';
import { isEmail, normalizeEmail } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { friendly } from '@/lib/messages';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const login = async () => {
    setErr(null);
    if (!isEmail(email) || !pw) return setErr('Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password: pw });
    setBusy(false);
    if (error) setErr(friendly(error)); // guard redirects on success
  };
  return (
    <Screen footer={<View style={{ gap: 4 }}>
      <Button label="Log in" onPress={login} loading={busy} />
      <Text onPress={() => r.push('/apply')} accessibilityRole="link" style={{ textAlign: 'center', padding: 12, fontFamily: fonts.body, fontSize: 15, color: colors.muted }}>
        New here? <Text style={{ fontFamily: fonts.bodySemi, color: colors.ink, textDecorationLine: 'underline' }}>Request an invitation</Text>
      </Text>
    </View>}>
      <BackButton />
      <FadeUp>
        <View style={{ marginTop: 18 }}>
          <Title>Welcome back.</Title>
          <Body style={{ marginTop: 8 }}>Log in with your personal email and password.</Body>
        </View>
      </FadeUp>
      <FadeUp delay={100}>
        <TextField label="Personal email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <TextField label="Password" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" onSubmitEditing={login} />
        <Text onPress={() => r.push('/forgot-password')} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingVertical: 14, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' }}>Forgot, or haven't set a password?</Text>
        {err ? <Notice tone="error">{err}</Notice> : null}
      </FadeUp>
    </Screen>
  );
}
