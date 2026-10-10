import React, { useState } from 'react';
import { Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Body, Button, Logo, Screen, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { useAuth } from '@/lib/auth';

/** Shown to anyone who has applied and is not accepted yet (in review or declined). */
export default function Status() {
  const { application: a, session, refresh, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!a) return null;
  const declined = a.status === 'rejected';
  const link = `${SITE_URL}/?ref=${a.referral_code}`;
  const check = async () => { setBusy(true); await refresh(); setBusy(false); };

  return (
    <Screen footer={<Button label="Log out" variant="link" onPress={signOut} />}>
      <View style={{ marginTop: 24 }}><Logo size="md" /></View>
      {declined ? (
        <View style={{ marginTop: 40 }}>
          <Title italic>Not this time.</Title>
          <Body style={{ marginTop: 8 }}>Thank you for applying, {a.full_name.split(' ')[0]}. We couldn't make room for this application. We read every one by hand, and it was not an easy call.</Body>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 102, lineHeight: 107, color: colors.ink }}>{a.queue_position != null ? `#${a.queue_position}` : '·'}</Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 1.6, color: colors.faint }}>YOUR PLACE IN THE QUEUE</Text>
          </View>
          <View style={{ marginTop: 28 }}>
            <Title italic>Under review.</Title>
            <Body style={{ marginTop: 8 }}>A person is reading your application, {a.full_name.split(' ')[0]}. When it's a fit, this screen turns into your way in. We'll also email {session?.user.email}. Refreshing won't make it faster. We checked.</Body>
          </View>
          <Button label="Check again" variant="secondary" onPress={check} loading={busy} style={{ marginTop: 20 }} />
          <View style={{ marginTop: 28, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Know someone who belongs? Share your code. Vouching fast-tracks them.</Text>
            <Text selectable style={{ fontFamily: fonts.display, fontSize: 35, letterSpacing: 4, color: colors.ink, marginTop: 6 }}>{a.referral_code}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" style={{ flex: 1 }} onPress={async () => { await Clipboard.setStringAsync(link); setCopied(true); }} />
              <Button label="Share" variant="secondary" style={{ flex: 1 }} onPress={() => Share.share({ message: `I've applied to The Semi Circle - a private community that's by invitation only. I can vouch for you: ${link}` })} />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
