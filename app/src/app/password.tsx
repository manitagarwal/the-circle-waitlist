import React from 'react';
import { Body, Button, Screen, Title } from '@/components/ui';
import { PasswordForm } from '@/components/PasswordForm';
import { useAuth } from '@/lib/auth';

/** Everyone needs a password. This stops anyone who has an account without one. */
export default function CreatePassword() {
  const { refresh, signOut } = useAuth();
  return (
    <Screen footer={<Button label="Log out" variant="link" onPress={signOut} />}>
      <Title italic>Create your password.</Title>
      <Body style={{ marginTop: 6 }}>You'll use it every time you log in. The emailed code is only for resetting it.</Body>
      <PasswordForm submitLabel="Save password" onDone={refresh} />
    </Screen>
  );
}
