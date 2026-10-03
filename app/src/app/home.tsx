import React from 'react';
import { Body, Button, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';

// Placeholder until the tab screens are built.
export default function Home() {
  const { member, signOut } = useAuth();
  return (
    <Screen>
      <Title italic>Hello, @{member?.username}.</Title>
      <Body style={{ marginTop: 8 }}>The rest of the app is on its way.</Body>
      <Button label="Log out" variant="secondary" onPress={signOut} style={{ marginTop: 24 }} />
    </Screen>
  );
}
