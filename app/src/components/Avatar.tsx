import React from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AVATAR_SVGS } from '@/lib/avatars';
import { colors, isDark } from '@/theme';
import { useSignedUrl } from '@/lib/media';

// Soft background and deep figure colour per avatar, so the set reads as a varied group, not a row of black shapes.
const PALETTE: [string, string][] = [
  ['#e8d9c4', '#5b3d22'], ['#d6e3d2', '#2f5a3b'], ['#d3dfe9', '#2a4a68'], ['#ecd3d0', '#6e3a36'], ['#e3d8ec', '#4d3a6b'], ['#f0e3b8', '#6b5416'],
  ['#cfe5e2', '#235a57'], ['#efd5c3', '#7a4220'], ['#d9e0c6', '#46592a'], ['#dccfe0', '#5a3a63'], ['#cfd9ea', '#2c4577'], ['#e9d0d9', '#6d2f48'],
];
const DARK: [string, string][] = PALETTE.map(([, fg]) => ['#2b2723', '#efe9df'] as [string, string]);
const DARK_SOLID = (c: string) => c;
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (fg: string, bg: string, o: number) => '#' + hex(fg).map((v, i) => Math.round(v * o + hex(bg)[i] * (1 - o)).toString(16).padStart(2, '0')).join('');
/** Solid colours only: no opacity or clip paths, so every renderer draws the same picture. */
const tinted = (id: number): string => {
  const [bg, fg] = (isDark ? DARK : PALETTE)[(id - 1) % PALETTE.length];
  const solid = DARK_SOLID(bg);
  return AVATAR_SVGS[id]
    .replace(/<defs>.*?<\/defs>/, '').replace(/<g clip-path="[^"]*">/, '<g>')
    .replace(/<rect width="200" height="200" fill="currentColor" fill-opacity="\.08"\/>/, `<rect width="200" height="200" fill="${solid}"/>`)
    .replace(/fill="currentColor"(?: fill-opacity="([\d.]+)")?/g, (_m, o) => `fill="${o ? mix(fg, solid, Number(o)) : fg}"`)
    .replace(/stroke="currentColor"/g, `stroke="${fg}"`);
};

/** A member's picture: their photo if they have one, otherwise their avatar. */
export function Avatar({ avatarId, uri, size = 64 }: { avatarId?: number | null; uri?: string | null; size?: number }) {
  const round = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const, backgroundColor: colors.line };
  if (uri) return <Image source={{ uri }} style={round} accessibilityIgnoresInvertColors />;
  const xml = avatarId ? AVATAR_SVGS[avatarId] : undefined;
  return <View style={round}>{xml ? <SvgXml xml={tinted(avatarId!)} width={size} height={size} /> : null}</View>;
}

/** Avatar for a person row: loads the signed photo link when they have a photo. */
export function PersonAvatar({ person, size = 44 }: { person: { avatar_id?: number | null; photo_path?: string | null }; size?: number }) {
  const url = useSignedUrl(person.photo_path);
  return <Avatar avatarId={person.avatar_id} uri={url} size={size} />;
}
