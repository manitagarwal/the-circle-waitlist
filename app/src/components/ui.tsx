import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, RefreshControl, Platform, ScrollView, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '@/theme';
import { PressScale, useReduceMotion } from './motion';

export function Screen({ children, footer, scroll = true, onRefresh, refreshing }: {
  children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const inTabs = useSegments()[0] === '(tabs)'; // the fixed top bar already clears the status bar
  const topPad = inTabs ? 8 : insets.top + 8;
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: topPad }} keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.ink} /> : undefined}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: topPad }}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
      {footer ? <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12, backgroundColor: colors.ground, borderTopWidth: 1, borderTopColor: colors.line }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <Text style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted }, style]}>{children}</Text>
);
/** The big headline. `italic` is kept for older callers and now means the same display size. */
export const Title = ({ children }: { children: React.ReactNode; italic?: boolean }) => (
  <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.9, color: colors.ink }}>{children}</Text>
);

export function BackButton({ onPress }: { onPress?: () => void }) {
  const r = useRouter();
  return (
    <PressScale accessibilityLabel="Back" accessibilityRole="button" onPress={onPress ?? (() => (r.canGoBack() ? r.back() : r.replace('/')))}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 5l-7 7 7 7" />
      </Svg>
    </PressScale>
  );
}

function StepBar({ on, delay }: { on: boolean; delay: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(on ? 0 : 1)).current;
  useEffect(() => {
    if (!on || reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 700, delay, easing: Easing.bezier(0.3, 0.8, 0.3, 1), useNativeDriver: true }).start();
  }, [on, reduce, delay, v]);
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, overflow: 'hidden' }}>
      {on ? <Animated.View style={{ flex: 1, backgroundColor: colors.ink, transform: [{ scaleX: v }], transformOrigin: 'left' } as never} /> : null}
    </View>
  );
}

export function StepHeader({ step, of }: { step: number; of: number }) {
  return (
    <View>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.faint }}>Step {step} of {of}</Text>
      </View>
      <View accessibilityLabel={`Step ${step} of ${of}`} style={{ flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 20 }}>
        {Array.from({ length: of }, (_, i) => <StepBar key={i} on={i < step} delay={i * 80} />)}
      </View>
    </View>
  );
}

/** The half-circle mark with the name beside it. */
export function Logo({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const fs = size === 'lg' ? 22 : 19; const w = size === 'lg' ? 34 : 30;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Svg width={w} height={w * 0.6} viewBox="0 0 40 24" fill="none"><Path d="M4 21A16 16 0 0 1 36 21Z" stroke={colors.ink} strokeWidth={3.2} strokeLinejoin="round" /></Svg>
      <Text style={{ fontFamily: fonts.title, fontSize: fs, letterSpacing: -0.2, color: colors.ink }}>The Semi Circle</Text>
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'accent' | 'link'; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const off = disabled || loading;
  const base: ViewStyle = { height: variant === 'link' ? 48 : 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.35 : 1 };
  const v: ViewStyle = variant === 'primary' ? { backgroundColor: colors.ink }
    : variant === 'accent' ? { backgroundColor: colors.gold }
    : variant === 'secondary' ? { backgroundColor: colors.ground, borderWidth: 1.5, borderColor: colors.ink } : {};
  const fg = variant === 'primary' ? '#ffffff' : colors.ink;
  return (
    <PressScale accessibilityRole="button" accessibilityState={{ disabled: !!off }} disabled={off} onPress={onPress} style={[base, v, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <Text style={{ fontFamily: variant === 'link' ? fonts.bodySemi : fonts.bodySemi, fontSize: 17, color: fg, textDecorationLine: variant === 'link' ? 'underline' : 'none' }}>{label}</Text>
      )}
    </PressScale>
  );
}

export function TextField({ label, error, hint, ok, style, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string; ok?: boolean }) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? colors.error : ok ? colors.sage : focus ? colors.ink : 'transparent';
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label} placeholderTextColor="#8f887c"
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={[{ height: 56, borderRadius: radius.control, backgroundColor: focus || error || ok ? colors.ground : colors.surface, borderWidth: 1.5, borderColor: border, paddingHorizontal: 16, fontSize: 16, fontFamily: fonts.body, color: colors.ink }, style]}
        {...rest}
      />
      {error ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 6 }}>{error}</Text>
        : hint ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>{hint}</Text> : null}
    </View>
  );
}

export function Notice({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'plain' | 'error' }) {
  const t = tone === 'gold' ? { b: 'transparent', bg: colors.accentSoft } : tone === 'error' ? { b: colors.error, bg: colors.ground } : { b: 'transparent', bg: colors.surface };
  return (
    <View style={{ marginTop: 14, borderWidth: 1.5, borderColor: t.b, backgroundColor: t.bg, borderRadius: radius.control, paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: tone === 'error' ? colors.error : colors.ink }}>{children}</Text>
    </View>
  );
}

export const strong = (t: string) => <Text style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{t}</Text>;

/** Plus / minus control for a whole number. */
export function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const btn = (txt: string, disabled: boolean, onPress: () => void, a11y: string) => (
    <PressScale accessibilityRole="button" accessibilityLabel={a11y} disabled={disabled} onPress={onPress}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 20, color: colors.ink }}>{txt}</Text>
    </PressScale>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {btn('−', value <= min, () => onChange(value - 1), `Fewer ${label}`)}
        <Text accessibilityLiveRegion="polite" style={{ minWidth: 28, textAlign: 'center', fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>{value}</Text>
        {btn('+', value >= max, () => onChange(value + 1), `More ${label}`)}
      </View>
    </View>
  );
}
