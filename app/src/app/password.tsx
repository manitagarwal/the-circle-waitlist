import React from 'react';
import { useRouter } from 'expo-router';
import { Body, Button, Screen, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';

export default function CreatePassword() {
  const r = useRouter();
  const next = () => r.replace('/setup');
  return (
    <Screen>
      <Title italic>One more lock.</Title>
      <Body style={{ marginTop: 6 }}>A password means next time you skip the inbox. Optional, but your future self will thank you.</Body>
      <PasswordForm submitLabel="Create password" onDone={next}>
        <Button label="Maybe later" variant="link" onPress={next} />
        <Body style={{ textAlign: 'center', fontSize: 13 }}>Skip it and we'll email a code every time you sign in.</Body>
      </PasswordForm>
    </Screen>
  );
}
