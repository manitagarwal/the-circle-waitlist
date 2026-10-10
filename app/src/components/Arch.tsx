import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { AVATAR_SVGS } from '@/lib/avatars';
import { colors } from '@/theme';
import { useReduceMotion } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A yellow arch with three half-rings that draw themselves in, one after another. */
export function ArchRings({ width: fixed, height: fixedH }: { width?: number; height?: number }) {
  const reduce = useReduceMotion();
  const [measured, setMeasured] = React.useState(0);
  const width = fixed ?? measured;
  const height = fixedH ?? Math.round(width / 2);
  const half = width / 2;
  const radii = [half * 0.825, half * 0.53, half * 0.24];
  const vals = useRef(radii.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) { vals.forEach((v) => v.setValue(1)); return; }
    Animated.stagger(300, vals.map((v) => Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }))).start();
  }, [reduce, vals]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={fixed ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      style={fixed ? { width, height, borderTopLeftRadius: half, borderTopRightRadius: half, backgroundColor: colors.gold, overflow: 'hidden' } : { width: '100%', height: '100%', backgroundColor: colors.gold, overflow: 'hidden' }}>
      {width > 0 ? <Svg width={width} height={height} style={fixed ? undefined : { position: 'absolute', bottom: 0 }}>
        {radii.map((r, i) => {
          const len = Math.PI * r;
          return <AnimatedPath key={i} d={`M${half - r} ${height}A${r} ${r} 0 0 1 ${half + r} ${height}`} stroke={colors.ink} strokeWidth={3} fill="none"
            strokeDasharray={[len, len]} strokeDashoffset={vals[i].interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />;
        })}
      </Svg> : null}
    </View>
  );
}

/** A member's photo (or avatar) in the signature arch frame. */
export function ArchPhoto({ uri, avatarId, maxWidth }: { uri?: string | null; avatarId?: number | null; maxWidth?: number }) {
  const [w, setW] = React.useState(0);
  const xml = avatarId ? AVATAR_SVGS[avatarId] : undefined;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ width: '100%', maxWidth, alignSelf: 'center', aspectRatio: 1.06, borderTopLeftRadius: 999, borderTopRightRadius: 999, overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'flex-end' }}>
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
        : xml && w ? <View style={{ position: 'absolute', bottom: w * 0.1 }}><SvgXml xml={xml} width={w * 0.8} height={w * 0.8} /></View> : null}
    </View>
  );
}

/** A small yellow arch with a mark inside it, for screens that stop the member (paused, closed). */
export function ArchEmblem({ kind }: { kind: 'pause' | 'close' }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: 96, height: 96, borderTopLeftRadius: 48, borderTopRightRadius: 48, backgroundColor: kind === 'pause' ? colors.gold : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={3} strokeLinecap="round">
        {kind === 'pause' ? <Path d="M9 6v12M15 6v12" /> : <Path d="M6 6l12 12M18 6L6 18" />}
      </Svg>
    </View>
  );
}
