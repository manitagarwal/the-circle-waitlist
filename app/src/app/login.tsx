import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Body, Button, Logo, Notice, Screen, TextField, Title } from '@/components/ui';
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
    if (!isEmail(email) || !pw) return setErr('Enter your work email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password: pw });
    setBusy(false);
    if (error) setErr(friendly(error)); // guard redirects on success
  };
  return (
    <Screen>
      <BackButton />
      <View style={{ marginTop: 24 }}><Logo size="md" /></View>
      <View style={{ marginTop: 40 }}>
        <Title>Welcome back.</Title>
        <Body style={{ marginTop: 10 }}>Log in with the work email you joined with.</Body>
      </View>
      <TextField label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <TextField label="Password" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" onSubmitEditing={login} />
      <Text onPress={() => r.push('/forgot-password')} accessibilityRole="link" style={{ alignSelf: 'flex-end', paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: colors.goldText }}>Forgot, or haven't set a password?</Text>
      {err ? <Notice tone="error">{err}</Notice> : null}
      <Button label="Log in" onPress={login} loading={busy} style={{ marginTop: 12 }} />
      <View style={{ marginTop: 'auto', paddingBottom: 24, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>New here?</Text>
        <Text onPress={() => r.push('/apply')} accessibilityRole="link" style={{ padding: 10, fontFamily: fonts.body, fontSize: 14, color: colors.goldText, textDecorationLine: 'underline' }}>Request an invitation</Text>
      </View>
    </Screen>
  );
}
