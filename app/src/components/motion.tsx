import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

/** True when the phone is set to reduce motion: animations then jump straight to their end state. */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => live && setReduce(v)).catch(() => {});
    return () => { live = false; };
  }, []);
  return reduce;
}

/** Fades and slides its children up once when they first appear. */
export function FadeUp({ children, delay = 0, distance = 14, style }: { children: React.ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 650, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1.1), useNativeDriver: true }).start();
  }, [reduce, delay, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A pressable that shrinks slightly while held. The style goes on the pressable itself, so flex and alignSelf behave as usual. */
export function PressScale({ children, style, scaleTo = 0.97, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children?: React.ReactNode }) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (n: number) => Animated.spring(v, { toValue: n, speed: 34, bounciness: n === 1 ? 14 : 0, useNativeDriver: true }).start();
  return (
    <AnimatedPressable {...rest} style={[style, { transform: [{ scale: v }] }]} onPressIn={(e: GestureResponderEvent) => { to(scaleTo); rest.onPressIn?.(e); }} onPressOut={(e: GestureResponderEvent) => { to(1); rest.onPressOut?.(e); }}>
      {children}
    </AnimatedPressable>
  );
}

/** Grows from the left to its full width, for progress bars. */
export function GrowBar({ pct, color, height = 8, track }: { pct: number; color: string; height?: number; track: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 900, delay: 250, easing: Easing.bezier(0.3, 0.8, 0.3, 1), useNativeDriver: true }).start();
  }, [reduce, v]);
  return (
    <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ height, width: `${Math.max(0, Math.min(100, pct))}%`, borderRadius: height / 2, backgroundColor: color, transform: [{ scaleX: v }], transformOrigin: 'left' } as never} />
    </Animated.View>
  );
}

/** A coloured bar that fills a poll option from the left, from nothing to its share. */
export function Fill({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 900, delay, easing: Easing.bezier(0.3, 0.8, 0.3, 1), useNativeDriver: true }).start();
  }, [reduce, delay, v]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: color, transform: [{ scaleX: v }], transformOrigin: 'left' } as never} />;
}
