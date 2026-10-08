import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, TextField, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { normalizeEmail } from '@/lib/validators';
import { api } from '@/lib/auth';
import { useApply } from './_layout';

/** Step 2: create the login. The personal email is the username; the work email is what we verify. */
export default function CreateLogin() {
  const r = useRouter();
  const { s, set } = useApply();
  const done = s.personalVerified && s.passwordSet; // "personalVerified" here means the account exists

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/apply/work')} disabled={!done} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={2} of={5} />
      <Title italic>Create your login.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Your personal email is how you'll log in. Choose a password to go with it.</Body>
      <TextField label="Personal email" value={s.personalEmail} editable={false} ok={done} />
      {done ? <Notice tone="plain">✓ Your login is ready.</Notice> : (
        <View style={{ marginTop: 8 }}>
          {s.personalVerified ? (
            <PasswordForm submitLabel="Save password" onDone={() => set({ passwordSet: true })} />
          ) : (
            <PasswordForm
              submitLabel="Create login"
              submit={(pw) => api.signUp(s.personalEmail, pw)}
              onDone={() => set({ personalVerified: true, passwordSet: true, personalEmail: normalizeEmail(s.personalEmail) })}
            />
          )}
        </View>
      )}
    </Screen>
  );
}
