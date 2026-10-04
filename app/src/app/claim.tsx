import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { cleanUsername, usernameProblem } from '@/lib/validators';
import { api, useAuth } from '@/lib/auth';
import { friendly, usernameStatusText } from '@/lib/messages';

/** Accepted, no membership yet: pick the name everyone will know you by. */
export default function Claim() {
  const { application, refresh, signOut } = useAuth();
  const [name, setName] = useState('');
  const [avail, setAvail] = useState<'idle' | 'local' | 'checking' | string>('idle');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return setAvail('idle');
    if (usernameProblem(name)) return setAvail('local');
    setAvail('checking');
    let live = true;
    const t = setTimeout(() => {
      api.usernameAvailable(name).then((s) => live && setAvail(s)).catch(() => live && setAvail('idle'));
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [name]);

  const nameError = avail === 'local' ? usernameProblem(name) : !['ok', 'idle', 'checking'].includes(avail) ? usernameStatusText(avail) : null;
  const go = async () => {
    setBusy(true); setErr(null);
    try { await api.activate(name); await refresh(); } // routing moves on once the membership exists
    catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  return (
    <Screen footer={<Text onPress={signOut} accessibilityRole="link" style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 14, color: colors.muted, padding: 8 }}>Log out</Text>}>
      <Title italic>You're in, {application?.full_name.split(' ')[0]}.</Title>
      <Body style={{ marginTop: 6 }}>Your application was accepted. One last thing: pick the name everyone will know you by.</Body>
      <TextField label="Username" value={name} onChangeText={(v) => setName(cleanUsername(v).slice(0, 20))} autoCapitalize="none" autoCorrect={false}
        error={nameError} ok={avail === 'ok'}
        hint={avail === 'ok' ? `${name} is available.` : avail === 'checking' ? 'Checking…' : 'Lowercase letters, numbers, dot and underscore. 3 to 20 characters. Change it once every 30 days.'} />
      {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 12 }}>{err}</Text> : null}
      <Button label="Continue" onPress={go} loading={busy} disabled={avail !== 'ok'} style={{ marginTop: 24 }} />
    </Screen>
  );
}
