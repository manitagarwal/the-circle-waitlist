import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Enter } from './fx';
import { libraryPhotoUrl } from '@/lib/photoUrl';
import { colors } from '@/theme';

// Photos from our own library (public links), one per column.
const PATHS = ['36c977d3-3567-43bf-a661-622316000b15.jpg', '58ba96a0-0c5a-426e-bad3-42286a8ee32a.jpg', '9a7a5049-888f-46e7-92ef-4097b5de6183.jpg', '82fe0242-df84-439e-9073-a6637098a5c5.jpg', '57f2d597-d3bd-49c7-aa4f-678847f014f0.jpg'];
const HEIGHTS = [0.72, 0.9, 1, 0.9, 0.72];

/** A row of tall photos with half-circle tops: the Semi Circle mark, made of pictures. */
export function PhotoArches({ width, height = 230 }: { width: number; height?: number }) {
  const gap = 8, w = (width - gap * (PATHS.length - 1)) / PATHS.length;
  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', gap }}>
      {PATHS.map((p, i) => (
        <Enter key={p} index={i}>
          <View style={{ width: w, height: height * HEIGHTS[i], borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, overflow: 'hidden', backgroundColor: colors.plate }}>
            <Image source={{ uri: libraryPhotoUrl(p)! }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={400} accessibilityIgnoresInvertColors />
          </View>
        </Enter>
      ))}
    </View>
  );
}
