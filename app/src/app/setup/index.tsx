import React from 'react';
import { Body, Button, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';

// Placeholder until the 8-step profile setup is built.
export default function Setup() {
  const { member, signOut } = useAuth();
  return (
    <Screen>
      <Title italic>Welcome, @{member?.username}.</Title>
      <Body style={{ marginTop: 8 }}>Profile setup is the next thing we build.</Body>
      <Button label="Log out" variant="secondary" onPress={signOut} style={{ marginTop: 24 }} />
    </Screen>
  );
}
