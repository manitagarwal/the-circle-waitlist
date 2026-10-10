import React, { useState } from 'react';
import { Text } from 'react-native';
import { ChipRow } from './ChipRow';
import { Chip } from './lists';
import { colors, fonts } from '@/theme';

type Bucket<T> = { group: { id: number | string; name: string }; items: T[] };

/** One calm list with a rail of activity groups on top, instead of every group stacked one after another. */
export function Buckets<T>({ buckets, render }: { buckets: Bucket<T>[]; render: (items: T[]) => React.ReactNode }) {
  const [sel, setSel] = useState<string>('all');
  if (buckets.length === 0) return null;
  const chosen = buckets.find((b) => String(b.group.id) === sel);
  const items = chosen ? chosen.items : buckets.flatMap((b) => b.items);
  const total = buckets.reduce((n, b) => n + b.items.length, 0);
  return (
    <>
      {buckets.length > 1 ? (
        <ChipRow>
          <Chip label={`All ${total}`} on={!chosen} onPress={() => setSel('all')} />
          {buckets.map((b) => <Chip key={b.group.id} label={`${b.group.name} ${b.items.length}`} on={chosen === b} onPress={() => setSel(String(b.group.id))} />)}
        </ChipRow>
      ) : null}
      {chosen ? <Text style={{ fontFamily: fonts.title, fontSize: 26, color: colors.ink, marginTop: 20, marginBottom: 2 }}>{chosen.group.name}</Text> : null}
      {render(items)}
    </>
  );
}
