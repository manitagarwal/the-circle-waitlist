import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Body, Button, Notice, TextField, Title } from './ui';
import { colors, fonts } from '@/theme';
import { passwordChecks } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { friendly } from '@/lib/messages';

function Check({ ok, text }: { ok: boolean; text: string }) {
  return <Text style={{ fontFamily: fonts.body, fontSize: 13, color: ok ? colors.sage : colors.faint, marginTop: 4 }}>{ok ? '✓' : '○'}  {text}</Text>;
}

/** Sets the signed-in user's password. Used by onboarding (optional) and by reset. */
export function PasswordForm({ onDone, submitLabel, children }: { onDone: () => void; submitLabel: string; children?: React.ReactNode }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = passwordChecks(pw);
  const save = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr(/weak|pwned|leak|common/i.test(error.message) ? 'That password has appeared in a data leak. Pick another.' : friendly(error));
    else onDone();
  };
  return (
    <View>
      <TextField label="Password" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" />
      <View style={{ marginTop: 6 }}>
        <Check ok={c.length} text="At least 8 characters" />
        <Check ok={c.mixed} text="A number or symbol is a good idea" />
      </View>
      {err ? <Notice tone="error">{err}</Notice> : null}
      <Button label={submitLabel} onPress={save} loading={busy} disabled={!c.length} style={{ marginTop: 24 }} />
      {children}
    </View>
  );
}
