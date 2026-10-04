import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Body, Button, Logo, Screen } from '@/components/ui';
import { colors, fonts } from '@/theme';

export default function Welcome() {
  const r = useRouter();
  return (
    <Screen scroll={false}>
      <View style={{ marginTop: 80, alignItems: 'center', gap: 14 }}>
        <Logo />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.faint }}>Members only.</Text>
      </View>
      <View style={{ marginTop: 48, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.title, fontSize: 28, lineHeight: 35, color: colors.ink, textAlign: 'center' }}>Most people won't get in.{'\n'}That's the point.</Text>
        <Body style={{ marginTop: 12, textAlign: 'center' }}>A private, hand-picked community of good people. Better company, after hours.</Body>
      </View>
      <View style={{ marginTop: 'auto', paddingBottom: 24, gap: 10 }}>
        <Button label="Log in" onPress={() => r.push('/login')} />
        <Button label="Request an invitation" variant="secondary" onPress={() => r.push('/apply')} />
        <Button label="I have an invitation code" variant="link" onPress={() => r.push('/join')} />
        <Text onPress={() => r.push('/status')} accessibilityRole="link" style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingVertical: 8 }}>Applied already? Check your status</Text>
      </View>
    </Screen>
  );
}
