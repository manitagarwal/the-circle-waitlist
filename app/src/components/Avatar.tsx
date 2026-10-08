import React from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AVATAR_SVGS } from '@/lib/avatars';
import { colors } from '@/theme';
import { useSignedUrl } from '@/lib/media';

/** A member's picture: their photo if they have one, otherwise their avatar. */
export function Avatar({ avatarId, uri, size = 64 }: { avatarId?: number | null; uri?: string | null; size?: number }) {
  const round = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const, backgroundColor: colors.line };
  if (uri) return <Image source={{ uri }} style={round} accessibilityIgnoresInvertColors />;
  const xml = avatarId ? AVATAR_SVGS[avatarId] : undefined;
  return <View style={round}>{xml ? <SvgXml xml={xml} width={size} height={size} /> : null}</View>;
}

/** Avatar for a person row: loads the signed photo link when they have a photo. */
export function PersonAvatar({ person, size = 44 }: { person: { avatar_id?: number | null; photo_path?: string | null }; size?: number }) {
  const url = useSignedUrl(person.photo_path);
  return <Avatar avatarId={person.avatar_id} uri={url} size={size} />;
}
