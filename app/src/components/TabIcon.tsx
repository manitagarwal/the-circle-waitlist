import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '@/theme';
import { useReduceMotion } from './motion';

/** A tab icon. The active tab gets the yellow half-circle marker that drops in from the top edge of the bar. */
export function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(focused ? 1 : 0); return; }
    Animated.timing(v, { toValue: focused ? 1 : 0, duration: 420, easing: focused ? Easing.out(Easing.back(2)) : Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [focused, reduce, v]);
  return (
    <View style={{ width: 40, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -14, width: 26, height: 13, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, backgroundColor: colors.gold,
        opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-13, 0] }) }] }} />
      <Icon name={name} size={26} color={color} strokeWidth={1.8} />
    </View>
  );
}
