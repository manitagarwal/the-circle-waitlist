import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Notice, TextField } from './ui';
import { colors, fonts } from '@/theme';
import { passwordChecks } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { friendly } from '@/lib/messages';

function Check({ ok, text }: { ok: boolean; text: string }) {
  return <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ok ? colors.sage : colors.faint, marginTop: 4 }}>{ok ? '✓' : '○'}  {text}</Text>;
}

/** Sets the signed-in user's password. A password is mandatory, so there is no skip. */
export function PasswordForm({ onDone, submitLabel }: { onDone: () => void | Promise<void>; submitLabel: string }) {
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = passwordChecks(pw);
  const same = pw === again;
  const save = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      setErr(/weak|pwned|leak|common/i.test(error.message) ? 'That password has appeared in a data leak. Pick another.'
        : /different from the old/i.test(error.message) ? 'Pick a password you have not used before.' : friendly(error));
      return;
    }
    try { await onDone(); } finally { setBusy(false); }
  };
  return (
    <View>
      <TextField label="Password" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" />
      <View style={{ marginTop: 6 }}>
        <Check ok={c.length} text="At least 8 characters" />
        <Check ok={c.mixed} text="A number or symbol is a good idea" />
      </View>
      <TextField label="Confirm password" value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" autoComplete="new-password"
        error={again && !same ? "Those two don't match." : null} onSubmitEditing={save} />
      {err ? <Notice tone="error">{err}</Notice> : null}
      <Button label={submitLabel} onPress={save} loading={busy} disabled={!c.length || !same} style={{ marginTop: 24 }} />
    </View>
  );
}
