import React from 'react';
import { Body, Screen, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { useAuth } from '@/lib/auth';
import { Info } from '@/components/Info';

export default function ResetPassword() {
  const { endRecovery, refresh } = useAuth();
  return (
    <Screen>
      <Title italic>Set a new password.</Title>
      <Info text={"You're signed in. Pick a password to use from now on."} />
      <PasswordForm submitLabel="Save password" onDone={async () => { await refresh(); endRecovery(); }} />
    </Screen>
  );
}
