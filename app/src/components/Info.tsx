import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme';

/** A small "i" that opens a short explanation, so screens stay free of commentary. */
export function Info({ text, title, size = 22, style }: { text: string; title?: string; size?: number; style?: object }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={title ? `About ${title}` : 'More information'} hitSlop={12} onPress={() => setOpen(true)}
        style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 8 }, style]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}><Circle cx={12} cy={12} r={10} stroke={colors.faint} strokeWidth={1.4} fill="none" /></Svg>
        <Icon name="info" size={size * 0.7} color={colors.faint} strokeWidth={2} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(29,28,26,0.4)', justifyContent: 'flex-end' }}>
          <Pressable accessible={false} style={{ backgroundColor: colors.ground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginBottom: 16 }} />
            {title ? <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink, marginBottom: 8 }}>{title}</Text> : null}
            <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 23, color: colors.muted }}>{text}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
