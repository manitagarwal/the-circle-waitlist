import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Guidelines } from '@/components/Guidelines';
import { Sheet } from '@/components/lists';
import { Body, Button, Logo, Screen, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { useAuth } from '@/lib/auth';

const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(new Date(iso)) : null);

/** Shown once when a suspended member opens the app. They can still read; they cannot post. */
export default function Paused() {
  const { member, acknowledgePause } = useAuth();
  const [rules, setRules] = useState(false);
  const until = day(member?.suspended_until ?? null);
  return (
    <Screen footer={<View style={{ gap: 4 }}><Button label="Go back to reading" onPress={acknowledgePause} /><Button label="Read the community guidelines" variant="link" onPress={() => setRules(true)} /></View>}>
      <View style={{ marginTop: 24 }}><Logo size="md" /></View>
      <View style={{ marginTop: 40 }}>
        <Title italic>Your account is paused.</Title>
        <Body style={{ marginTop: 10 }}>{until ? `It stays paused until ${until}.` : 'It stays paused for now.'}</Body>
        <Body style={{ marginTop: 10 }}>You can still read your channels, messages and bookings.</Body>
        <Body style={{ marginTop: 10 }}>You can't send messages, join or host bookings, or create channels.</Body>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 20 }}>A report about you was reviewed by the team and upheld. Another one ends your membership.</Text>
      </View>
      <Sheet visible={rules} onClose={() => setRules(false)} title="Community guidelines"><Guidelines /></Sheet>
    </Screen>
  );
}
