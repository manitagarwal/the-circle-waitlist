import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';
import { countdown } from '@/lib/countdown';
import { useReduceMotion } from './motion';

export { tap } from '@/lib/haptic';

/** Slides up and fades in, one after another. */
export function Enter({ children, index = 0, style }: { children: React.ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  return <Animated.View entering={reduce ? undefined : FadeInDown.delay(60 + index * 70).duration(520).easing(Easing.out(Easing.cubic))} style={style}>{children}</Animated.View>;
}

/** A grey block that shimmers while content loads. */
export function Skeleton({ w = '100%', h = 16, r = 10, style }: { w?: number | `${number}%`; h?: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const v = useSharedValue(0.45);
  useEffect(() => { v.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true); }, [v]);
  const a = useAnimatedStyle(() => ({ opacity: v.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.line }, a, style]} />;
}

/** A soft dot that breathes, for "happening soon" and "live". */
export function PulseDot({ color = colors.ink, size = 8 }: { color?: string; size?: number }) {
  const v = useSharedValue(1);
  useEffect(() => { v.value = withRepeat(withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true); }, [v]);
  const a = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.8 + v.value * 0.4 }] }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, a]} />;
}

/** Live "in 2h 14m" text that keeps counting. */
export function useCountdown(startsAt: string, endsAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  return countdown(startsAt, endsAt, now);
}

export const Spacer = ({ h }: { h: number }) => <View style={{ height: h }} />;
