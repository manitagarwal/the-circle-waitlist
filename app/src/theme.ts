// The refined look: warm ivory ground, deep charcoal ink, quiet stone surfaces and one muted brass accent.
// Token names are unchanged so every screen picks the new look up from here.
export const colors = {
  ground: '#fbfaf7',
  card: '#f2efe9',          // fills for cards, fields and chips (no outline needed)
  line: '#ebe7df',          // hairlines
  lineStrong: '#ddd7cb',
  ink: '#1d1c1a',
  muted: '#5d5953',
  faint: '#756f66',
  gold: '#b08a4a',          // the accent: unread rings, markers, highlights
  onGold: '#ffffff',
  goldText: '#8a6a30',      // links and small labels are ink with a yellow underline
  goldTint: 'rgba(176,138,74,0.12)',
  goldBorder: 'rgba(176,138,74,0.55)',
  sage: '#3f6b52',
  error: '#1d1c1a',
  clay: '#5d5953',          // unread dots
  terracotta: '#756f66',
  surface: '#f2efe9',
  accentSoft: '#f6f0e4',
} as const;

export const radius = { control: 12, card: 16, bubble: 18, pill: 28 } as const;

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  title: 'CormorantGaramond_600SemiBold',
  titleMedium: 'CormorantGaramond_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;
