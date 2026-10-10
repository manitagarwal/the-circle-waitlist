import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useReduceMotion } from './motion';
import { colors, fonts } from '@/theme';

const TABS = [
  { name: 'channels', label: 'Channels' },
  { name: 'events', label: 'Events' },
  { name: 'bookings', label: 'Bookings' },
  { name: 'profile', label: 'Profile' },
] as const;

export type BarProps = { state: { index: number; routes: { key: string; name: string }[] }; navigation: { navigate: (name: string) => void; emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean } } };

function Item({ label, icon, on, onPress }: { label: string; icon: string; on: boolean; onPress: () => void }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(on ? 1 : 0); return; }
    Animated.spring(v, { toValue: on ? 1 : 0, speed: 14, bounciness: 12, useNativeDriver: false }).start();
  }, [on, reduce, v]);
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress}>
      <Animated.View style={{ height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: v.interpolate({ inputRange: [0, 1], outputRange: [14, 18] }),
        backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(128,128,128,0)', 'rgba(128,128,128,0.22)'] }) }}>
        <Icon name={icon} size={22} color={colors.inkOn} strokeWidth={1.8} />
        <Animated.View style={{ overflow: 'hidden', maxWidth: v.interpolate({ inputRange: [0, 1], outputRange: [0, 84] }), opacity: v, marginLeft: v.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.inkOn }}>{label}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** The bottom navigation: a dark pill floating above the content; the current tab opens up to show its name. */
export function FloatingTabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) + 6, alignItems: 'center' }}>
      <View accessibilityRole="tablist" style={{ height: 64, borderRadius: 32, backgroundColor: colors.ink, padding: 8, flexDirection: 'row', gap: 4,
        shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}>
        {TABS.map((t) => {
          const route = state.routes.find((r) => r.name === t.name);
          if (!route) return null;
          return <Item key={t.name} label={t.label} icon={t.name} on={current === t.name} onPress={() => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (current !== t.name && !e.defaultPrevented) navigation.navigate(t.name);
          }} />;
        })}
      </View>
    </View>
  );
}
