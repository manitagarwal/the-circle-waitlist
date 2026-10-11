import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/** Drag it and it tilts towards your finger, then settles back. For tickets and other things worth fiddling with. */
export function TiltCard({ children, style, size = 260 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; size?: number }) {
  const rx = useSharedValue(0), ry = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate((e) => { ry.value = Math.max(-18, Math.min(18, (e.translationX / size) * 36)); rx.value = Math.max(-18, Math.min(18, (-e.translationY / size) * 36)); })
    .onEnd(() => { rx.value = withSpring(0, { damping: 9 }); ry.value = withSpring(0, { damping: 9 }); });
  const a = useAnimatedStyle(() => ({ transform: [{ perspective: 700 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }] }));
  return <GestureDetector gesture={pan}><Animated.View style={[style, a]}>{children}</Animated.View></GestureDetector>;
}
