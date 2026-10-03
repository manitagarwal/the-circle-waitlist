import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/theme';

export function Screen({ children, footer, scroll = true }: { children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: insets.top + 8 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: insets.top + 8 }}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.glow} pointerEvents="none" />
      {body}
      {footer ? <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted }, style]}>{children}</Text>
);
export const Title = ({ children, italic }: { children: React.ReactNode; italic?: boolean }) => (
  <Text accessibilityRole="header" style={italic
    ? { fontFamily: fonts.display, fontSize: 32, lineHeight: 37, color: colors.ink }
    : { fontFamily: fonts.title, fontSize: 26, lineHeight: 33, color: colors.ink }}>{children}</Text>
);

export function BackButton({ onPress }: { onPress?: () => void }) {
  const r = useRouter();
  return (
    <Pressable accessibilityLabel="Back" onPress={onPress ?? (() => (r.canGoBack() ? r.back() : r.replace('/')))}
      style={{ width: 44, height: 44, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 5l-7 7 7 7" />
      </Svg>
    </Pressable>
  );
}

export function StepHeader({ step, of }: { step: number; of: number }) {
  return (
    <View>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Step {step} of {of}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 20 }}>
        {Array.from({ length: of }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < step ? colors.gold : colors.line }} />
        ))}
      </View>
    </View>
  );
}

export function Logo({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const w = size === 'lg' ? 150 : 120; const fs = size === 'lg' ? 40 : 36;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={w * 0.6} viewBox="0 0 300 180" fill="none">
        <Path d="M30,150 A120,120 0 0 1 270,150" stroke={colors.goldText} strokeWidth={3} opacity={0.8} />
      </Svg>
      <Text style={{ fontFamily: fonts.display, fontSize: fs, color: colors.ink, marginTop: -w * 0.37 }}>
        The Semi <Text style={{ fontFamily: fonts.title }}>Circle</Text>
      </Text>
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'link'; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const off = disabled || loading;
  const base: ViewStyle = { height: variant === 'link' ? 48 : 52, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.5 : 1 };
  const v: ViewStyle = variant === 'primary' ? { backgroundColor: colors.gold }
    : variant === 'secondary' ? { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong } : {};
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!off }} disabled={off} onPress={onPress} style={[base, v, style]}>
      {loading ? <ActivityIndicator color={colors.onGold} /> : (
        <Text style={{
          fontFamily: variant === 'primary' ? fonts.bodySemi : fonts.bodyMedium, fontSize: 16,
          color: variant === 'primary' ? colors.onGold : variant === 'link' ? colors.goldText : colors.ink,
          textDecorationLine: variant === 'link' ? 'underline' : 'none',
        }}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextField({ label, error, hint, ok, style, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string; ok?: boolean }) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? colors.error : ok ? colors.sage : focus ? colors.goldText : colors.line;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label} placeholderTextColor={colors.faint}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={[{ height: 48, borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: border, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.body, color: colors.ink }, style]}
        {...rest}
      />
      {error ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 6 }}>{error}</Text>
        : hint ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>{hint}</Text> : null}
    </View>
  );
}

export function Notice({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'plain' | 'error' }) {
  const t = tone === 'gold' ? { b: colors.goldBorder, bg: colors.goldTint } : tone === 'error' ? { b: colors.error, bg: colors.card } : { b: colors.line, bg: colors.card };
  return (
    <View style={{ marginTop: 14, borderWidth: 1, borderColor: t.b, backgroundColor: t.bg, borderRadius: radius.control, paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: tone === 'error' ? colors.error : colors.muted }}>{children}</Text>
    </View>
  );
}

export const strong = (t: string) => <Text style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{t}</Text>;

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: -120, left: '50%', width: 520, height: 520, marginLeft: -260, borderRadius: 260, backgroundColor: colors.goldTint, opacity: 0.22 },
});
