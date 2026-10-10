import React from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '@/theme';
import { PressScale } from './motion';

/** A choice pill: black when picked, soft grey when not. Used for cities, genders, interests and the like. */
export function Pill({ label, on, onPress, role = 'radio', disabled, tint }: { label: string; on: boolean; onPress: () => void; role?: 'radio' | 'checkbox' | 'button'; disabled?: boolean; tint?: string | null }) {
  return (
    <PressScale accessibilityRole={role} accessibilityState={role === 'checkbox' ? { checked: on, disabled } : { selected: on, disabled }} disabled={disabled} onPress={onPress}
      style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: on ? colors.ink : tint ? tint : colors.line, backgroundColor: on ? (tint ?? colors.ink) : tint ? `${tint}66` : 'transparent', opacity: disabled ? 0.45 : 1 }}>
      <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 15, color: on && !tint ? colors.inkOn : colors.ink }}>{label}</Text>
    </PressScale>
  );
}
