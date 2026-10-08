import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, TextField, Title, strong } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { isOtp, normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useApply } from './_layout';

/** Step 2: prove the personal email (it becomes the login) and create the password. */
export default function VerifyPersonal() {
  const r = useRouter();
  const { s, set } = useApply();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'' | 'send' | 'verify'>('');
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    setErr(null); setBusy('send');
    try { await api.sendCode(s.personalEmail, true); setSent(true); }
    catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const verify = async () => {
    if (busy) return;
    setErr(null); setBusy('verify');
    try { await api.verifyCode(s.personalEmail, code); set({ personalVerified: true, personalEmail: normalizeEmail(s.personalEmail) }); }
    catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/apply/work')} disabled={!(s.personalVerified && s.passwordSet)} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={2} of={5} />
      <Title italic>Your login.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Your personal email is how you'll log in. We'll send a code to check it's yours, then you'll set a password.</Body>
      <TextField label="Personal email" value={s.personalEmail} editable={false} ok={s.personalVerified} />
      {!sent && !s.personalVerified ? <Button label="Send code" onPress={send} loading={busy === 'send'} style={{ marginTop: 16 }} /> : null}
      {err && !sent ? <Notice tone="error">{err}</Notice> : null}
      {sent && !s.personalVerified ? <>
        <Notice>We've sent a 6-digit code to {strong(s.personalEmail)}. Check your inbox and spam folder.</Notice>
        <TextField label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6}
          autoComplete="one-time-code" error={err} onSubmitEditing={verify} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Button label="Verify" onPress={verify} loading={busy === 'verify'} disabled={!isOtp(code)} style={{ flex: 1 }} />
          <Button label="Resend" variant="secondary" onPress={send} loading={busy === 'send'} style={{ flexBasis: 100 }} />
        </View>
      </> : null}
      {s.personalVerified ? (s.passwordSet ? <Notice tone="plain">✓ Email verified. Password set.</Notice> : (
        <View style={{ marginTop: 8 }}>
          <Notice tone="plain">✓ Email verified. Now create the password you'll use to log in.</Notice>
          <PasswordForm submitLabel="Save password" onDone={() => set({ passwordSet: true })} />
        </View>
      )) : null}
    </Screen>
  );
}
