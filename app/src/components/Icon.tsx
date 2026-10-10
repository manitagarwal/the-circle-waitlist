import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

const PATHS: Record<string, string[]> = {
  home: ['M4 11l8-7 8 7v9H4z', 'M10 20v-5h4v5'],
  channels: ['M4 5h16v11H9l-5 4V5z'],
  activity: ['M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17z', 'M10 21h4'],
  bookings: ['M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M4 10h16', 'M9 3v4', 'M15 3v4'],
  messages: ['M21 3L3 11l7 3 3 7 8-18z'],
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6'],
  events: ['M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z', 'M14 5v14'],
  plus: ['M12 5v14', 'M5 12h14'],
  back: ['M15 5l-7 7 7 7'],
  chevron: ['M9 5l7 7-7 7'],
  send: ['M21 3L3 11l7 3 3 7 8-18z'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  lock: ['M6 11h12v9H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  info: ['M12 11v6', 'M12 7.2h.01'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M16.5 16.5L21 21'],
  pin: ['M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z'],
};

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 1.6 }: { name: keyof typeof PATHS | string; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {name === 'dots' ? [5, 12, 19].map((cx) => <Circle key={cx} cx={cx} cy="12" r="1.8" fill={color} stroke="none" />) : (PATHS[name] ?? []).map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
}
