import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { PersonAvatar } from './Avatar';
import { Row, State } from './lists';
import { TextField } from './ui';
import { colors, fonts } from '@/theme';
import type { Person } from '@/lib/api';
import { addableFriends } from '@/lib/groups';

/** A searchable list of friends with checkmarks. Only friends can be added to a group. */
export function FriendPicker({ friends, exclude = [], selected, onToggle, max }: {
  friends: Person[]; exclude?: string[]; selected: string[]; onToggle: (id: string) => void; max: number;
}) {
  const [q, setQ] = useState('');
  const list = addableFriends(friends, exclude, q);
  return (
    <View>
      <TextField label="Search your friends" value={q} onChangeText={setQ} autoCapitalize="none" />
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 8 }}>{selected.length} picked. Room for {max} more.</Text>
      {friends.length === 0 ? <State empty="You have no friends to add yet. Send a friend request from someone's profile first." /> : null}
      {friends.length > 0 && list.length === 0 ? <State empty="Nobody matches." /> : null}
      {list.map((f) => {
        const on = selected.includes(f.id);
        const full = !on && selected.length >= max;
        return (
          <Row key={f.id} left={<PersonAvatar person={f} />} title={`@${f.username}`} subtitle={f.full_name}
            right={<Text style={{ fontFamily: fonts.bodySemi, fontSize: 18, color: on ? colors.sage : colors.line }}>{on ? '✓' : '○'}</Text>}
            onPress={full ? undefined : () => onToggle(f.id)} />
        );
      })}
    </View>
  );
}
