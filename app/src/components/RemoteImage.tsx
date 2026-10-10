import React from 'react';
import { Image, View } from 'react-native';
import { colors, radius } from '@/theme';
import { useSignedUrl } from '@/lib/media';

/** A picture from a private storage bucket (an admin's lobby post or announcement). Shows a quiet box while it loads. */
export function RemoteImage({ path, bucket = 'announcement-images', height = 180, label = 'Picture' }: { path: string | null | undefined; bucket?: string; height?: number; label?: string }) {
  const uri = useSignedUrl(path, bucket);
  if (!path) return null;
  return uri
    ? <Image accessibilityLabel={label} source={{ uri }} resizeMode="cover" style={{ width: '100%', height, borderRadius: radius.control, marginTop: 8, backgroundColor: colors.line }} />
    : <View style={{ width: '100%', height, borderRadius: radius.control, marginTop: 8, backgroundColor: colors.line }} />;
}
