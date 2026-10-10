import { Appearance } from 'react-native';

// Quiet luxury: warm ivory (or deep charcoal at night), charcoal ink, stone surfaces and no accent colour.
// Token names are unchanged so every screen picks the look up from here. The scheme is read when the app opens.
const light = {
  ground: '#faf8f4',
  card: '#f0ece4',          // fills for cards, fields and chips
  line: '#e8e3d9',          // hairlines
  lineStrong: '#ddd6c7',
  ink: '#1b1a18',
  inkOn: '#faf8f4',         // text on an ink-coloured fill
  muted: '#6b665e',
  faint: '#76706a',
  plate: '#ebe6db',         // the circle behind clipart
  tint: '#ddd6c7',          // clipart fill
} as const;
const dark = {
  ground: '#141311',
  card: '#1e1c19',
  line: '#2b2925',
  lineStrong: '#3b372f',
  ink: '#f3efe6',
  inkOn: '#141311',
  muted: '#a8a296',
  faint: '#8f897d',
  plate: '#26231f',
  tint: '#3b372f',
} as const;
export const isDark = Appearance.getColorScheme() === 'dark';
const base: { [K in keyof typeof light]: string } = isDark ? { ...dark } : { ...light };

export const colors = {
  ...base,
  gold: base.ink,           // no accent: markers and highlights are ink
  onGold: base.inkOn,
  goldText: base.ink,
  goldTint: isDark ? 'rgba(243,239,230,0.08)' : 'rgba(27,26,24,0.05)',
  goldBorder: base.lineStrong,
  sage: base.ink,           // success is ink too
  error: base.ink,          // never red
  clay: base.muted,
  terracotta: base.faint,
  surface: base.card,
  accentSoft: base.card,
} as const;

export const radius = { control: 16, card: 22, bubble: 20, pill: 28 } as const;

export const fonts = {
  display: 'Fraunces_400Regular',
  title: 'Fraunces_500Medium',
  titleMedium: 'Fraunces_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;
