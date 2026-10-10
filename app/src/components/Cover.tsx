import React from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Arcs } from './Arch';
import { activityIcon } from '@/lib/activityIcons';
import { colors } from '@/theme';

/** An event's picture. Without one, a stone panel with drawn rings and the activity's clipart. */
export function Cover({ uri, activity, height = 170 }: { uri?: string | null; activity?: string | null; height?: number }) {
  const icon = activityIcon(activity);
  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.plate, alignItems: 'center', justifyContent: 'center' }}>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors /> : (<>
        <Arcs width={Math.min(300, height * 1.8)} color={colors.tint} style={{ position: 'absolute', bottom: 0 }} delay={100} />
        {icon ? <SvgXml xml={icon} width={height * 0.46} height={height * 0.46} color={colors.ink} /> : null}
      </>)}
    </View>
  );
}
