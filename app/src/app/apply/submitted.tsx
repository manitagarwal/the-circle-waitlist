import React, { useEffect, useState } from 'react';
import { Share, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Body, Button, Screen, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { api } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Submitted() {
  const r = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const code = String(id).slice(0, 8).toUpperCase();
  const [pos, setPos] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const link = `${SITE_URL}/?ref=${code}`;

  useEffect(() => {
    api.applicantCount().then(setPos).catch(() => {});
    // the temporary work-email session has done its job
    supabase.auth.signOut();
  }, []);

  return (
    <Screen footer={<Button label="Done" onPress={() => r.replace('/')} />}>
      <View style={{ alignItems: 'center', marginTop: 48 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 52, color: colors.ink }}>{pos != null ? `#${pos}` : '·'}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: colors.faint }}>YOUR PLACE IN THE QUEUE</Text>
      </View>
      <View style={{ marginTop: 32 }}>
        <Title italic>You're on the list.</Title>
        <Body style={{ marginTop: 8 }}>We read every application by hand. If it's a fit, your invitation arrives by email. Refreshing won't make it faster. We checked.</Body>
      </View>
      <View style={{ marginTop: 24, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Your application ID. Save it to check your status later.</Text>
        <Text selectable style={{ fontFamily: fonts.title, fontSize: 28, letterSpacing: 4, color: colors.ink, marginTop: 6 }}>{code}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 4 }}>{link}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button label={copied ? 'Copied' : 'Copy'} variant="secondary" style={{ flex: 1 }} onPress={async () => { await Clipboard.setStringAsync(link); setCopied(true); }} />
        <Button label="Share" variant="secondary" style={{ flex: 1 }} onPress={() => Share.share({ message: `I've been let into The Semi Circle - a private community that's still by invitation only. I can vouch for you: ${link}` })} />
      </View>
      <Button label="Check my status" variant="link" onPress={() => r.push('/status')} />
    </Screen>
  );
}
