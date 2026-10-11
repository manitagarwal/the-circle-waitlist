import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PressScale } from './motion';
import { tap } from '@/lib/haptic';
import { colors, fonts } from '@/theme';

/** A button you press and keep pressing. It fills while you hold; let go early and it drains back. Used for things worth meaning: joining, paying, posting. */
export function HoldButton({ label, holdingLabel = 'Keep holding…', doneLabel, onComplete, ms = 900, disabled, loading }: {
  label: string; holdingLabel?: string; doneLabel?: string; onComplete: () => void; ms?: number; disabled?: boolean; loading?: boolean;
}) {
  const fill = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const off = disabled || loading || done;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const start = () => {
    if (off) return;
    setHolding(true); tap('light');
    fill.value = withTiming(1, { duration: ms, easing: Easing.linear });
    timer.current = setTimeout(() => { timer.current = null; setHolding(false); setDone(true); tap('success'); onComplete(); }, ms);
  };
  const stop = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!done) { cancelAnimation(fill); fill.value = withTiming(0, { duration: 260 }); }
    setHolding(false);
  };
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const text = done ? doneLabel ?? label : holding ? holdingLabel : label;
  return (
    <PressScale accessibilityRole="button" accessibilityLabel={label} accessibilityHint={`Press and hold for about a second`} accessibilityState={{ disabled: !!(disabled || loading) }}
      disabled={disabled || loading} onPressIn={start} onPressOut={stop} scaleTo={0.985}
      style={{ height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: colors.tint, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.ink }, bar]} />
      <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator color={colors.inkOn} /> : <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: holding || done || loading ? colors.inkOn : colors.ink }}>{text}</Text>}
      </View>
    </PressScale>
  );
}
