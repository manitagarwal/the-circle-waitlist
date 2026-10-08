import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

const PATHS: Record<string, string[]> = {
  channels: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
  activity: ['M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6', 'M10 19a2 2 0 0 0 4 0'],
  bookings: ['M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  messages: ['M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.5-6 8-6s8 2 8 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  back: ['M15 5l-7 7 7 7'],
  chevron: ['M9 5l7 7-7 7'],
  send: ['M4 12l16-8-6 16-3-7-7-1z'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  lock: ['M6 11h12v9H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  pin: ['M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z'],
};

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 1.6 }: { name: keyof typeof PATHS | string; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {(PATHS[name] ?? []).map((d, i) => <Path key={i} d={d} />)}
      {name === 'dots' ? <Circle cx="12" cy="12" r="0.5" /> : null}
    </Svg>
  );
}
