import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { Sheet } from './lists';
import { Button } from './ui';
import { colors, fonts, radius } from '@/theme';
import { addMonths, type Clock12, clockLabel, monthGrid, monthName, sameYmd, todayIST, type YMD, ymdKey } from '@/lib/schedule';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** A month calendar in a sheet. Days before today can't be picked. */
export function DatePickerSheet({ visible, value, onClose, onPick }: { visible: boolean; value: YMD | null; onClose: () => void; onPick: (d: YMD) => void }) {
  const today = todayIST();
  const [view, setView] = useState({ y: (value ?? today).y, m: (value ?? today).m });
  const grid = monthGrid(view.y, view.m);
  const atStart = view.y === today.y && view.m === today.m;
  const arrow = (dir: -1 | 1, disabled: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'} disabled={disabled} onPress={() => setView((v) => addMonths(v.y, v.m, dir))}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}>
      <View style={{ transform: [{ rotate: dir < 0 ? '180deg' : '0deg' }] }}><Icon name="chevron" /></View>
    </Pressable>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Pick a date">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {arrow(-1, atStart)}
        <Text accessibilityRole="header" style={{ fontFamily: fonts.titleMedium, fontSize: 21, color: colors.ink }}>{monthName(view.m)} {view.y}</Text>
        {arrow(1, false)}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {WEEK.map((w) => <Text key={w} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint }}>{w}</Text>)}
      </View>
      {grid.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={{ flex: 1, height: 44 }} />;
            const cell: YMD = { y: view.y, m: view.m, d: day };
            const past = ymdKey(cell) < ymdKey(today);
            const on = sameYmd(cell, value);
            const isToday = sameYmd(cell, today);
            return (
              <Pressable key={di} accessibilityRole="button" accessibilityLabel={`${day} ${monthName(view.m)} ${view.y}`} accessibilityState={{ selected: on, disabled: past }} disabled={past}
                onPress={() => { onPick(cell); onClose(); }}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: on ? colors.ink : 'transparent', borderWidth: isToday && !on ? 1.5 : 0, borderColor: colors.ink }}>
                <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 15, color: past ? colors.lineStrong : on ? colors.inkOn : colors.ink }}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Sheet>
  );
}

/** A time entry that only offers :00 and :30. */
export function TimePickerSheet({ visible, value, onClose, onPick }: { visible: boolean; value: Clock12 | null; onClose: () => void; onPick: (c: Clock12) => void }) {
  const [hour, setHour] = useState<number | null>(value?.hour ?? null);
  const [minute, setMinute] = useState<0 | 30>(value?.minute ?? 0);
  const [pm, setPm] = useState<boolean>(value?.pm ?? true);
  const btn = (label: string, on: boolean, onPress: () => void, w?: number) => (
    <Pressable key={label} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress}
      style={{ width: w, flex: w ? undefined : 1, minHeight: 48, margin: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.ink : colors.surface }}>
      <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 16, color: on ? colors.inkOn : colors.ink }}>{label}</Text>
    </Pressable>
  );
  const label = (t: string) => <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginTop: 14, marginLeft: 4 }}>{t}</Text>;
  return (
    <Sheet visible={visible} onClose={onClose} title="Pick a start time">
      {label('Hour')}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: 12 }, (_, i) => i + 1).map((h) => btn(String(h), hour === h, () => setHour(h), 72))}</View>
      {label('Minutes: on the hour or half hour')}
      <View style={{ flexDirection: 'row' }}>{btn(':00', minute === 0, () => setMinute(0)) }{btn(':30', minute === 30, () => setMinute(30))}</View>
      {label('AM or PM')}
      <View style={{ flexDirection: 'row' }}>{btn('AM', !pm, () => setPm(false))}{btn('PM', pm, () => setPm(true))}</View>
      <Button label={hour ? `Use ${clockLabel({ hour, minute, pm })}` : 'Pick an hour'} disabled={!hour} onPress={() => { onPick({ hour: hour!, minute, pm }); onClose(); }} style={{ marginTop: 18 }} />
    </Sheet>
  );
}
