import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PressScale } from './motion';
import { Arcs } from './Arch';
import { toneFor } from '@/lib/tones';
import { libraryPhotoUrl } from '@/lib/photoUrl';
import { colors, isDark } from '@/theme';

/** A card whose whole face is a picture, with a dark fade at the bottom for text. Without a picture it falls back to the activity's tone. */
export function PhotoCard({ photoPath, uri: given, activity, height = 230, onPress, children, label, top, radius = 26 }: {
  photoPath?: string | null; uri?: string | null; activity?: string | null; height?: number; onPress?: () => void; children?: React.ReactNode; label?: string; top?: React.ReactNode; radius?: number;
}) {
  const uri = given ?? libraryPhotoUrl(photoPath);
  const body = (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: toneFor(activity, isDark) ?? colors.plate }}>
      {uri ? <Image source={{ uri }} style={{ position: 'absolute', inset: 0 } as never} contentFit="cover" transition={400} accessibilityIgnoresInvertColors />
        : <Arcs width={260} color={isDark ? colors.lineStrong : '#ffffff'} stroke={2} style={{ position: 'absolute', bottom: 0, alignSelf: 'center' }} delay={100} />}
      <LinearGradient colors={['rgba(20,19,17,0.28)', 'rgba(20,19,17,0)', 'rgba(20,19,17,0.82)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', inset: 0 } as never} />
      {top ? <View style={{ position: 'absolute', top: 14, left: 16, right: 16 }}>{top}</View> : null}
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>{children}</View>
    </View>
  );
  return onPress ? <PressScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>{body}</PressScale> : body;
}
