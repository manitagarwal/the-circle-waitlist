import React from 'react';
import { Body, Screen, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { useAuth } from '@/lib/auth';

export default function ResetPassword() {
  const { endRecovery, refresh } = useAuth();
  return (
    <Screen>
      <Title italic>Set a new password.</Title>
      <Body style={{ marginTop: 6 }}>You're signed in. Pick a password to use from now on.</Body>
      <PasswordForm submitLabel="Save password" onDone={async () => { await refresh(); endRecovery(); }} />
    </Screen>
  );
}
