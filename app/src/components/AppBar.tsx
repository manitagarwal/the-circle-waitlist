import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme';

/** The fixed top bar: Activity on the left, the app name in the middle, Messages on the right. */
export function AppBar({ unread }: { unread: number }) {
  const r = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const on = (name: string) => path === `/${name}`;
  const btn = (name: 'activity' | 'messages', label: string, icon: string, badge?: number) => (
    <Pressable accessibilityRole="button" accessibilityLabel={badge ? `${label}, ${badge} unread` : label} accessibilityState={{ selected: on(name) }} onPress={() => r.navigate(`/${name}` as never)}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={24} color={on(name) ? colors.goldText : colors.ink} />
      {badge ? (
        <View style={{ position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: '#ffffff' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>) : null}
    </Pressable>
  );
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.ground, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
        {btn('activity', 'Activity', 'activity', unread)}
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
          The Semi <Text style={{ fontFamily: fonts.title }}>Circle</Text>
        </Text>
        {btn('messages', 'Messages', 'messages')}
      </View>
    </View>
  );
}
