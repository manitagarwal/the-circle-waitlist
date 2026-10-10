import React from 'react';
import { Linking, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Logo, Screen } from '@/components/ui';
import { ArchRings } from '@/components/Arch';
import { FadeUp } from '@/components/motion';
import { colors, fonts } from '@/theme';
import { BUILD, SITE_URL } from '@/lib/config';

export default function Welcome() {
  const r = useRouter();
  const { width } = useWindowDimensions();
  const w = Math.min(width, 480) - 48;
  const link = (label: string, path: string) => (
    <Text onPress={() => void Linking.openURL(`${SITE_URL}${path}`)} accessibilityRole="link" style={{ textDecorationLine: 'underline' }}>{label}</Text>
  );
  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 4 }}>
        <FadeUp><View style={{ marginTop: 8 }}><Logo size="md" /></View></FadeUp>
        <FadeUp delay={120} distance={50}><View style={{ marginTop: 28, alignSelf: 'center' }}><ArchRings width={w} height={Math.round(w * 0.83)} /></View></FadeUp>
        <FadeUp delay={550}>
          <View style={{ marginTop: 28 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 40, letterSpacing: -1.1, color: colors.ink }}>Most people won't get in. That's the point.</Text>
            <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.muted }}>A private, hand-picked community.</Text>
          </View>
        </FadeUp>
      </View>
      <View style={{ marginTop: 'auto', paddingBottom: 16, gap: 12 }}>
        <FadeUp delay={750}><Button label="Request an invitation" onPress={() => r.push('/apply')} /></FadeUp>
        <FadeUp delay={820}><Button label="Log in" variant="secondary" onPress={() => r.push('/login')} /></FadeUp>
        <FadeUp delay={900}>
          <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 4 }}>
            By continuing you agree to our {link('Terms', '/terms/')} and {link('Privacy policy', '/privacy/')}.
          </Text>
          <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.faint, marginTop: 6 }}>Build {BUILD}</Text>
        </FadeUp>
      </View>
    </Screen>
  );
}
