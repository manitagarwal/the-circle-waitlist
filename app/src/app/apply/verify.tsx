import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, TextField, Title, strong } from '@/components/ui';
import { isEmail, isOtp, isPersonalEmail, normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useApply } from './_layout';

export default function VerifyWork() {
  const r = useRouter();
  const { s, set } = useApply();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'' | 'send' | 'verify'>('');
  const [err, setErr] = useState<string | null>(null);
  const [codeErr, setCodeErr] = useState<string | null>(null);

  const send = async () => {
    setErr(null);
    if (!isEmail(s.workEmail)) return setErr('Enter a valid email address.');
    if (isPersonalEmail(s.workEmail)) return setErr('That looks like a personal inbox. Use your work or business email.');
    setBusy('send');
    try {
      const d = await api.checkDuplicates({ workEmail: s.workEmail });
      if (d.work_email) { setErr('This work email has already applied. One application per person.'); return; }
      await api.sendCode(s.workEmail, true);
      set({ workEmail: normalizeEmail(s.workEmail), verified: false }); setSent(true);
    } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const verify = async () => {
    setCodeErr(null); setBusy('verify');
    try { await api.verifyCode(s.workEmail, code); set({ verified: true }); }
    catch (e) { setCodeErr(friendly(e)); } finally { setBusy(''); }
  };

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/apply/vouch')} disabled={!s.verified} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={2} of={4} />
      <Title italic>Let's make it official.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Use your work or business email. We verify every member this way, and personal inboxes like Gmail don't pass.</Body>
      <TextField label="Work email" value={s.workEmail} onChangeText={(v) => { set({ workEmail: v, verified: false }); setSent(false); }}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err} ok={s.verified} editable={!s.verified} />
      {!sent ? <Button label="Send code" onPress={send} loading={busy === 'send'} style={{ marginTop: 16 }} /> : null}
      {sent ? <>
        <Notice>We've sent a 6-digit code to {strong(s.workEmail)}. Check your inbox and spam folder.</Notice>
        {!s.verified ? <>
          <TextField label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6}
            autoComplete="one-time-code" error={codeErr} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Button label="Verify" onPress={verify} loading={busy === 'verify'} disabled={!isOtp(code)} style={{ flex: 1 }} />
            <Button label="Resend" variant="secondary" onPress={send} loading={busy === 'send'} style={{ flexBasis: 100 }} />
          </View>
        </> : <Notice tone="plain">✓ Work email verified</Notice>}
      </> : null}
    </Screen>
  );
}
