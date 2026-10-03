export const colors = {
  ground: '#f3ecdf',
  card: '#ffffff',
  line: '#ddd2ba',
  lineStrong: '#bdae8e',
  ink: '#211c16',
  muted: '#645848',
  faint: '#76695a',
  gold: '#b6935e',
  onGold: '#1a1610',
  goldText: '#76582a',
  goldTint: 'rgba(182,147,94,0.16)',
  goldBorder: 'rgba(182,147,94,0.5)',
  sage: '#3f6a34',
  error: '#a8432f',
  clay: '#94492f',
  terracotta: '#a8624a',
} as const;

export const radius = { control: 6, card: 10, bubble: 14 } as const;

export const fonts = {
  display: 'Fraunces_300Light_Italic',
  title: 'Fraunces_400Regular',
  titleMedium: 'Fraunces_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;
