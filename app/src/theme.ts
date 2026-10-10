// The new look: white ground, near-black ink, soft grey surfaces and one yellow accent.
// Token names are unchanged so every screen picks the new look up from here.
export const colors = {
  ground: '#ffffff',
  card: '#f4f2ee',          // fills for cards, fields and chips (no outline needed)
  line: '#f0ece4',          // hairlines
  lineStrong: '#e4dfd5',
  ink: '#16120e',
  muted: '#5b554c',
  faint: '#6f685d',
  gold: '#f7b32b',          // the accent: unread rings, markers, highlights
  onGold: '#16120e',
  goldText: '#16120e',      // links and small labels are ink with a yellow underline
  goldTint: 'rgba(247,179,43,0.18)',
  goldBorder: 'rgba(247,179,43,0.7)',
  sage: '#2f7a4f',
  error: '#b3261e',
  clay: '#f7b32b',          // unread dots
  terracotta: '#6f685d',
  surface: '#f4f2ee',
  accentSoft: '#fff6e0',
} as const;

export const radius = { control: 16, card: 22, bubble: 20, pill: 28 } as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  title: 'BricolageGrotesque_700Bold',
  titleMedium: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
} as const;
