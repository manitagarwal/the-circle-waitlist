import React from 'react';
import { Body, Screen, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { useAuth } from '@/lib/auth';

export default function ResetPassword() {
  const { endRecovery } = useAuth();
  return (
    <Screen>
      <Title italic>Set a new password.</Title>
      <Body style={{ marginTop: 6 }}>You're signed in. Pick a password for next time.</Body>
      <PasswordForm submitLabel="Save password" onDone={endRecovery} />
    </Screen>
  );
}
