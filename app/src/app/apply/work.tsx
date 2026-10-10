import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, TextField, Title, strong } from '@/components/ui';
import { isEmail, isOtp, isPersonalEmail, normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useApply } from './_layout';
import { Info } from '@/components/Info';

/** Step 3: verify the work email. This is a check on the application, not a login. */
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
    if (normalizeEmail(s.workEmail) === normalizeEmail(s.personalEmail)) return setErr('Your work email has to be different from your personal one.');
    setBusy('send');
    try {
      const d = await api.checkDuplicates({ workEmail: s.workEmail });
      if (d.work_email) { setErr('This work email has already applied. One application per person.'); return; }
      await api.sendWorkCode(s.workEmail);
      set({ workEmail: normalizeEmail(s.workEmail), workVerified: false }); setSent(true);
    } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const verify = async () => {
    if (busy) return;
    setCodeErr(null); setBusy('verify');
    try { await api.verifyWorkCode(s.workEmail, code); set({ workVerified: true }); }
    catch (e) { setCodeErr(friendly(e)); } finally { setBusy(''); }
  };

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/apply/vouch')} disabled={!s.workVerified} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={3} of={5} />
      <Title italic>Let's make it official.</Title>
      <Info text={"Use your work or business email. We verify every member this way, and personal inboxes like Gmail don't pass. You won't log in with it."} />
      <TextField label="Work email" value={s.workEmail} onChangeText={(v) => { set({ workEmail: v, workVerified: false }); setSent(false); }}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err} ok={s.workVerified} editable={!s.workVerified} />
      {!sent && !s.workVerified ? <Button label="Send code" onPress={send} loading={busy === 'send'} style={{ marginTop: 16 }} /> : null}
      {sent && !s.workVerified ? <>
        <Notice>We've sent a 6-digit code to {strong(s.workEmail)}. Check your inbox and spam folder.</Notice>
        <TextField label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6}
          autoComplete="one-time-code" error={codeErr} onSubmitEditing={verify} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Button label="Verify" onPress={verify} loading={busy === 'verify'} disabled={!isOtp(code)} style={{ flex: 1 }} />
          <Button label="Resend" variant="secondary" onPress={send} loading={busy === 'send'} style={{ flexBasis: 100 }} />
        </View>
      </> : null}
      {s.workVerified ? <Notice tone="plain">✓ Work email verified</Notice> : null}
    </Screen>
  );
}
