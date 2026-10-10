import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme';

/** Top bar for pushed screens: back button, title block, optional right action. */
export function Bar({ title, subtitle, left, right, onTitlePress }: {
  title: string; subtitle?: string | null; left?: React.ReactNode; right?: React.ReactNode; onTitlePress?: () => void;
}) {
  const r = useRouter();
  const insets = useSafeAreaInsets();
  const titleBlock = (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {left}
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" numberOfLines={1} style={{ fontFamily: fonts.title, fontSize: 22, color: colors.ink }}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.ground }}>
      <View style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (r.canGoBack() ? r.back() : r.replace('/channels'))}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginRight: 8 }}><Icon name="back" /></Pressable>
        {onTitlePress ? <Pressable accessibilityRole="button" onPress={onTitlePress} style={{ flex: 1, flexDirection: 'row' }}>{titleBlock}</Pressable> : titleBlock}
        {right}
      </View>
    </View>
  );
}
