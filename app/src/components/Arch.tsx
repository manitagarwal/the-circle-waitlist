import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { AVATAR_SVGS } from '@/lib/avatars';
import { colors, isDark } from '@/theme';
import { useReduceMotion } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A stone arch with three half-rings that draw themselves in, one after another. */
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
    Animated.stagger(380, vals.map((v) => Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }))).start();
  }, [reduce, vals]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={fixed ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      style={fixed ? { width, height, borderTopLeftRadius: half, borderTopRightRadius: half, backgroundColor: colors.plate, overflow: 'hidden' } : { width: '100%', height: '100%', backgroundColor: colors.plate, overflow: 'hidden' }}>
      {width > 0 ? <Svg width={width} height={height} style={fixed ? undefined : { position: 'absolute', bottom: 0 }}>
        {radii.map((r, i) => {
          const len = Math.PI * r;
          return <AnimatedPath key={i} d={`M${half - r} ${height}A${r} ${r} 0 0 1 ${half + r} ${height}`} stroke={colors.tint} strokeWidth={1.6} fill="none"
            strokeDasharray={[len, len]} strokeDashoffset={vals[i].interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />;
        })}
      </Svg> : null}
    </View>
  );
}

/** A member's photo (or avatar) in a circle. */
export function ArchPhoto({ uri, avatarId, size = 160 }: { uri?: string | null; avatarId?: number | null; size?: number }) {
  const xml = avatarId ? AVATAR_SVGS[avatarId] : undefined;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" accessibilityIgnoresInvertColors />
        : xml ? <SvgXml xml={xml} width={size} height={size} color={colors.ink} /> : null}
    </View>
  );
}

/** A small yellow arch with a mark inside it, for screens that stop the member (paused, closed). */
export function ArchEmblem({ kind }: { kind: 'pause' | 'close' }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: 96, height: 96, borderTopLeftRadius: 48, borderTopRightRadius: 48, backgroundColor: kind === 'pause' ? colors.gold : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={colors.tint} strokeWidth={1.6} strokeLinecap="round">
        {kind === 'pause' ? <Path d="M9 6v12M15 6v12" /> : <Path d="M6 6l12 12M18 6L6 18" />}
      </Svg>
    </View>
  );
}

/** Faint half-rings that draw themselves in. A quiet signature behind headers, covers and empty states. */
export function Arcs({ width = 300, color = colors.line, stroke = 1.5, delay = 200, style }: { width?: number; color?: string; stroke?: number; delay?: number; style?: object }) {
  const reduce = useReduceMotion();
  const h = width / 2;
  const radii = [h, h * 0.72, h * 0.44];
  const vals = useRef(radii.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) { vals.forEach((v) => v.setValue(1)); return; }
    Animated.stagger(300, vals.map((v) => Animated.timing(v, { toValue: 1, duration: 2200, delay, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }))).start();
  }, [reduce, vals, delay]);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={style}>
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none">
        {radii.map((r, i) => {
          const len = Math.PI * r;
          return <AnimatedPath key={i} d={`M${h - r} ${h}A${r} ${r} 0 0 1 ${h + r} ${h}`} stroke={color} strokeWidth={stroke} strokeDasharray={[len, len]}
            strokeDashoffset={vals[i].interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />;
        })}
      </Svg>
    </View>
  );
}

/** Three nested half-discs in the activity colours that rise into place: the welcome picture. */
export function ArchDiscs({ width = 320 }: { width?: number }) {
  const reduce = useReduceMotion();
  const h = width / 2;
  const discs = [{ r: h, c: isDark ? '#3a3157' : '#d9ccf2' }, { r: h * 0.72, c: isDark ? '#5a3f26' : '#f6d3b3' }, { r: h * 0.44, c: isDark ? '#2e4a33' : '#cfe4c8' }];
  const vals = useRef(discs.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) { vals.forEach((v) => v.setValue(1)); return; }
    Animated.stagger(160, vals.map((v) => Animated.spring(v, { toValue: 1, speed: 10, bounciness: 9, useNativeDriver: true }))).start();
  }, [reduce, vals]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: h, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
      {discs.map((d, i) => (
        <Animated.View key={i} style={{ position: 'absolute', bottom: 0, width: d.r * 2, height: d.r, borderTopLeftRadius: d.r, borderTopRightRadius: d.r, backgroundColor: d.c,
          opacity: vals[i], transform: [{ translateY: vals[i].interpolate({ inputRange: [0, 1], outputRange: [d.r * 0.5, 0] }) }] }} />
      ))}
    </View>
  );
}
