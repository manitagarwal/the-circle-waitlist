import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { FriendPicker } from '@/components/FriendPicker';
import { Row, SectionLabel, Sheet, State } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import type { Person } from '@/lib/api';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { GROUP_MAX_MEMBERS, spotsLeft } from '@/lib/groups';
import { useLoad } from '@/lib/useLoad';

type Entry = Person & { role: string };

export default function ChannelSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const { member } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [target, setTarget] = useState<Entry | null>(null);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(async () => {
    const [channels, roster] = await Promise.all([api.channels(), api.roster(id)]);
    const people = await api.people(roster.map((x) => x.member_id));
    const byId = Object.fromEntries(people.map((p) => [p.id, p]));
    const entries: Entry[] = roster.map((x) => ({ ...(byId[x.member_id] ?? { id: x.member_id, username: 'member', full_name: null, avatar_id: null, photo_path: null }), role: x.role }));
    entries.sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || a.username.localeCompare(b.username));
    const friends = member ? await api.friends(member.id) : [];
    return { channel: channels.find((c) => c.id === id) ?? null, entries, friends };
  }, [id]);

  const isAdmin = data?.channel?.my_role === 'admin';
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true); setErr(null);
    try { await fn(); after ? after() : await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); setTarget(null); setConfirm(null); }
  };
  const toChannels = () => r.replace('/channels');

  const isGroup = data?.channel?.kind === 'private';
  const inGroup = (data?.entries ?? []).map((e) => e.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Channel settings" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <State loading={loading} error={error} onRetry={reload} />
        {data?.channel ? (<>
          {isAdmin ? (<>
            <TextField label="Channel name" value={name ?? data.channel.name} onChangeText={setName} maxLength={50} />
            {name !== null && name.trim() !== data.channel.name && name.trim().length >= 3 ? (
              <Button label="Save name" variant="secondary" loading={busy} onPress={() => run(() => api.renameChannel(id, name.trim()), () => { setName(null); void reload(); })} style={{ marginTop: 12 }} />) : null}
          </>) : <Text style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink }}>{data.channel.name}</Text>}

          <SectionLabel>{isGroup ? `Members, ${data.entries.length} of ${GROUP_MAX_MEMBERS}` : `Members, ${data.entries.length}`}</SectionLabel>
          {isAdmin && isGroup ? <Button label="Add friends" variant="secondary" onPress={() => { setPicked([]); setAdding(true); }} style={{ marginBottom: 8 }} /> : null}
          {data.entries.map((e) => (
            <Row key={e.id} left={<PersonAvatar person={e} />} title={e.id === member?.id ? 'You' : e.full_name ?? e.username} subtitle={`@${e.username}`}
              meta={e.role === 'admin' ? 'ADMIN' : null} tag={e.role === 'admin' ? 'admin' : null}
              right={isAdmin && e.id !== member?.id ? <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="dots" /></View> : undefined}
              onPress={isAdmin && e.id !== member?.id ? () => setTarget(e) : undefined} />
          ))}
          <Body style={{ fontSize: 13, marginTop: 8 }}>{isAdmin ? 'Tap a member to make them an admin or remove them. ' : ''}Everyone in the channel can see this list.</Body>

          {err ? <Notice tone="error">{err}</Notice> : null}
          <View style={{ marginTop: 28, gap: 10 }}>
            <Button label="Leave channel" variant="secondary" onPress={() => setConfirm('leave')} />
            {isAdmin ? <Button label="Delete channel" variant="secondary" onPress={() => setConfirm('delete')} /> : null}
          </View>
          <Body style={{ fontSize: 13, marginTop: 12 }}>If you're the only admin and you leave, a random member takes over. Deleting is for admins and can't be undone.</Body>
        </>) : null}
      </ScrollView>

      <Sheet visible={!!target} onClose={() => setTarget(null)} title={target ? `@${target.username}` : ''}>
        {target ? (<View style={{ gap: 8 }}>
          <Button label={target.role === 'admin' ? 'Remove as admin' : 'Make admin'} variant="secondary" loading={busy} onPress={() => run(() => api.setChannelAdmin(id, target.id, target.role !== 'admin'))} />
          <Button label="Remove from channel" variant="secondary" loading={busy} onPress={() => run(() => api.removeChannelMember(id, target.id))} />
          <Button label="Cancel" variant="link" onPress={() => setTarget(null)} />
        </View>) : null}
      </Sheet>

      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add friends">
        <ScrollView keyboardShouldPersistTaps="handled">
          <Body style={{ fontSize: 14, marginBottom: 4 }}>Friends you add join straight away. Only friends can be added.</Body>
          <FriendPicker friends={data?.friends ?? []} exclude={inGroup} selected={picked} max={spotsLeft(inGroup.length, 0)} onToggle={(fid) => setPicked((p) => (p.includes(fid) ? p.filter((x) => x !== fid) : [...p, fid]))} />
        </ScrollView>
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label={picked.length ? `Add ${picked.length}` : 'Pick friends to add'} loading={busy} disabled={!picked.length} onPress={() => run(() => api.addToGroup(id, picked), () => { setAdding(false); setPicked([]); void reload(); })} style={{ marginTop: 12 }} />
      </Sheet>

      <Sheet visible={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'delete' ? 'Delete this channel?' : 'Leave this channel?'}>
        <Body style={{ marginBottom: 16 }}>{confirm === 'delete' ? "Everyone loses access and it can't be undone." : "You can rejoin later if it's public, or if someone invites you again."}</Body>
        <View style={{ gap: 8 }}>
          <Button label={confirm === 'delete' ? 'Delete channel' : 'Leave channel'} loading={busy} onPress={() => run(() => (confirm === 'delete' ? api.closeChannel(id) : api.leaveChannel(id)), toChannels)} />
          <Button label="Cancel" variant="link" onPress={() => setConfirm(null)} />
        </View>
      </Sheet>
    </View>
  );
}
