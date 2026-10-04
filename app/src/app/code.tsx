import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton, Body, Button, Notice, Screen, TextField, Title, strong } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { isOtp } from '@/lib/validators';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';

/** Six-digit email code. mode: login | reset */
export default function Code() {
  const r = useRouter();
  const { startRecovery } = useAuth();
  const { email = '', mode = 'login' } = useLocalSearchParams<{ email: string; mode: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async () => {
    if (!isOtp(code)) return setErr('Enter the six digits.');
    setBusy(true); setErr(null);
    try {
      if (mode === 'reset') startRecovery(); // before verify, so the guards never flash the app
      await api.verifyCode(email, code);
      if (mode === 'reset') r.replace('/reset-password');
      // login: the auth guard routes by application status
    } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  const resend = async () => {
    try { await api.sendCode(email, false); setWait(30); setErr(null); } catch (e) { setErr(friendly(e)); }
  };

  return (
    <Screen footer={<Body style={{ textAlign: 'center', fontSize: 13, color: colors.faint }}>The code works once and expires in ten minutes.</Body>}>
      <BackButton />
      <Title>Check your inbox.</Title>
      <Body style={{ marginTop: 10 }}>Six digits, sent to {strong(String(email))}. Spam folder if it plays hard to get.</Body>
      <TextField label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode"
        style={{ fontFamily: fonts.title, fontSize: 24, letterSpacing: 8 }} error={err} onSubmitEditing={verify} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text onPress={wait > 0 ? undefined : resend} accessibilityRole="button" style={{ fontFamily: fonts.body, fontSize: 14, color: wait > 0 ? colors.faint : colors.goldText, paddingVertical: 10 }}>
          {wait > 0 ? `Resend in 0:${String(wait).padStart(2, '0')}` : 'Resend code'}
        </Text>
        <Text onPress={() => r.back()} accessibilityRole="link" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.goldText, paddingVertical: 10 }}>Wrong email?</Text>
      </View>
      <Button label="Verify" onPress={verify} loading={busy} disabled={code.length < 6} style={{ marginTop: 16 }} />
    </Screen>
  );
}
