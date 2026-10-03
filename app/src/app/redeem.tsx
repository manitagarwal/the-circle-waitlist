import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { BackButton, Body, Button, Screen, TextField, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { cleanInviteCode, cleanUsername, isInviteCode, usernameProblem } from '@/lib/validators';
import { api, useAuth } from '@/lib/auth';
import { friendly, usernameStatusText } from '@/lib/messages';

export default function Redeem() {
  const { refreshMember, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [avail, setAvail] = useState<'idle' | 'checking' | 'ok' | string>('idle');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return setAvail('idle');
    const local = usernameProblem(name);
    if (local) return setAvail('local');
    setAvail('checking');
    let live = true;
    const t = setTimeout(() => {
      api.usernameAvailable(name).then((s) => live && setAvail(s)).catch(() => live && setAvail('idle'));
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [name]);

  const nameError = avail === 'local' ? usernameProblem(name) : avail !== 'ok' && avail !== 'idle' && avail !== 'checking' ? usernameStatusText(avail) : null;
  const ready = isInviteCode(code) && avail === 'ok';
  const go = async () => {
    setBusy(true); setErr(null);
    try { await api.redeem(cleanInviteCode(code), name); await refreshMember(); } // gate moves on
    catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  return (
    <Screen footer={<Text onPress={signOut} accessibilityRole="link" style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.muted, padding: 8 }}>Lost the code? Reply to your acceptance email and we'll send a new one.</Text>}>
      <BackButton onPress={signOut} />
      <Title italic>You're in. Almost.</Title>
      <Body style={{ marginTop: 6 }}>Enter the invitation code from your acceptance email, then pick the name everyone will know you by.</Body>
      <TextField label="Invitation code" value={code} onChangeText={(v) => setCode(v.toUpperCase().slice(0, 14))} autoCapitalize="characters" autoCorrect={false}
        style={{ fontFamily: fonts.title, letterSpacing: 3 }} />
      <TextField label="Username" value={name} onChangeText={(v) => setName(cleanUsername(v).slice(0, 20))} autoCapitalize="none" autoCorrect={false}
        error={nameError} ok={avail === 'ok'}
        hint={avail === 'ok' ? `${name} is available.` : avail === 'checking' ? 'Checking…' : 'Lowercase letters, numbers, dot and underscore. 3 to 20 characters. Change it once every 30 days.'} />
      {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 12 }}>{err}</Text> : null}
      <Button label="Continue" onPress={go} loading={busy} disabled={!ready} style={{ marginTop: 24 }} />
    </Screen>
  );
}
