import React from 'react';
import { Image, View } from 'react-native';
import { colors } from '@/theme';
import { useSignedUrl } from '@/lib/media';

// Pre-drawn pictures, one per avatar id. Plain images, so every phone shows them the same way.
export const PICTURES: Record<number, number> = {
  1: require('../../assets/avatars/1.png'), 2: require('../../assets/avatars/2.png'), 3: require('../../assets/avatars/3.png'), 4: require('../../assets/avatars/4.png'),
  5: require('../../assets/avatars/5.png'), 6: require('../../assets/avatars/6.png'), 7: require('../../assets/avatars/7.png'), 8: require('../../assets/avatars/8.png'),
  9: require('../../assets/avatars/9.png'), 10: require('../../assets/avatars/10.png'), 11: require('../../assets/avatars/11.png'), 12: require('../../assets/avatars/12.png'),
};

/** A member's picture: their photo if they have one, otherwise their avatar. */
export function Avatar({ avatarId, uri, size = 64 }: { avatarId?: number | null; uri?: string | null; size?: number }) {
  const round = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const, backgroundColor: colors.line };
  if (uri) return <Image source={{ uri }} style={round} accessibilityIgnoresInvertColors />;
  const pic = avatarId ? PICTURES[avatarId] : undefined;
  return <View style={round}>{pic ? <Image source={pic} style={{ width: size, height: size }} accessibilityIgnoresInvertColors /> : null}</View>;
}

/** Avatar for a person row: loads the signed photo link when they have a photo. */
export function PersonAvatar({ person, size = 44 }: { person: { avatar_id?: number | null; photo_path?: string | null }; size?: number }) {
  const url = useSignedUrl(person.photo_path);
  return <Avatar avatarId={person.avatar_id} uri={url} size={size} />;
}
