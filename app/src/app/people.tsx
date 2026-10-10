import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Row, State } from '@/components/lists';
import { Button, Notice, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import type { FoundPerson } from '@/lib/api';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';

/** Find members by name. With a channel it picks people to invite; without, it opens profiles and chats. */
export default function People() {
  const { channel, name } = useLocalSearchParams<{ channel?: string; name?: string }>();
  const r = useRouter();
  const { member } = useAuth();
  const inviting = !!channel;
  const [q, setQ] = useState('');
  const [found, setFound] = useState<FoundPerson[]>([]);
  const [friends, setFriends] = useState<FoundPerson[]>([]);
  const [roster, setRoster] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!member) return;
    api.friends(member.id).then((f) => setFriends(f.map((p) => ({ ...p, area: null })))).catch(() => {});
    if (channel) api.roster(channel).then((x) => setRoster(x.map((m) => m.member_id))).catch(() => {});
  }, [member, channel]);

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.searchMembers(q).then((x) => { setFound(x); setErr(null); }).catch((e) => setErr(friendly(e))).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const typed = q.trim().length >= 2;
  const list = (typed ? found : friends).filter((p) => p.id !== member?.id);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const send = async () => {
    setBusy(true); setErr(null);
    let sent = 0;
    try {
      for (const id of picked) { await api.inviteToPublicChannel(channel!, id); sent++; }
      setDone(`Invited ${sent} ${sent === 1 ? 'person' : 'people'}. They'll see it in Activity.`);
      setPicked([]);
    } catch (e) {
      setErr(sent ? `Invited ${sent}, then: ${friendly(e)}` : friendly(e));
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title={inviting ? `Invite to ${name ?? 'channel'}` : 'Find people'} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <TextField label="Search by name or @username" value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false} />
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.faint, marginTop: 20, marginBottom: 4 }}>
          {typed ? 'Results' : 'Your friends'}
        </Text>
        <State loading={searching && typed && found.length === 0} empty={typed && !searching && list.length === 0 ? 'Nobody found. Try another spelling.' : !typed && list.length === 0 ? 'Type at least two letters to search everyone in the community.' : null} />
        {list.map((p) => {
          const inside = roster.includes(p.id);
          const on = picked.includes(p.id);
          return (
            <Row key={p.id} left={<PersonAvatar person={p} />} title={p.full_name ?? p.username} subtitle={`@${p.username}${p.area ? `, ${p.area}` : ''}`}
              right={inviting
                ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: inside ? 13 : 18, color: inside ? colors.faint : on ? colors.ink : colors.line }}>{inside ? 'In channel' : on ? '✓' : '○'}</Text>
                : <Pressable accessibilityRole="button" accessibilityLabel={`Message ${p.username}`} onPress={() => r.push({ pathname: '/dm/[id]', params: { id: p.id } })}
                    style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>Message</Text></Pressable>}
              onPress={inviting ? (inside ? undefined : () => toggle(p.id)) : () => r.push({ pathname: '/member/[id]', params: { id: p.id } })} />
          );
        })}
        {!inviting ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 16 }}>Open a profile to add them as a friend. Strangers get one message until they accept.</Text> : null}
        {done ? <Notice tone="plain">{done}</Notice> : null}
        {err ? <Notice tone="error">{err}</Notice> : null}
      </ScrollView>
      {inviting ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: colors.ground }}>
          <Button label={picked.length ? `Invite ${picked.length}` : 'Pick people to invite'} disabled={!picked.length} loading={busy} onPress={send} />
        </View>) : null}
    </View>
  );
}
