import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { ReportSheet } from '@/components/ReportSheet';
import { Sheet, State } from '@/components/lists';
import { Button } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { composerState } from '@/lib/dm';
import { dayLabel, sameDay } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';
import { supabase } from '@/lib/supabase';

export default function DmThread() {
  const { id: other } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const insets = useSafeAreaInsets();
  const { member } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, loading, reload } = useLoad(async () => {
    const [person, rel, dms] = await Promise.all([api.profile(other), api.friendship(other), api.dms()]);
    const dm = dms.find((d) => d.other_id === other) ?? null;
    const messages = dm ? await api.messages(dm.channel_id) : [];
    return { person, rel, dm, messages };
  }, [other]);

  useEffect(() => {
    if (!data?.dm) return;
    const ch = supabase.channel(`dm:${data.dm.channel_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${data.dm.channel_id}` }, () => { void reload(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [data?.dm?.channel_id, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const name = data?.person?.username ?? 'Member';
  const first = data?.person?.full_name?.split(' ')[0] ?? name;
  const sentMine = useMemo(() => (data?.messages ?? []).filter((m) => m.sender_id === member?.id), [data, member?.id]);
  const mode = data ? composerState(data.rel, sentMine.length) : 'open';

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setErr(null);
    try { await api.sendDm(other, body); setText(''); await reload(); } catch (e) { setErr(friendly(e)); } finally { setSending(false); }
  };
  const respond = async (accept: boolean) => { setBusy(true); try { await api.respondFriend(other, accept); await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); } };
  const act = async (fn: () => Promise<unknown>, after?: () => void) => { setBusy(true); setMenu(false); try { await fn(); after ? after() : await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); } };

  const msgs = data?.messages ?? [];
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Bar title={name} subtitle={data?.rel?.status === 'accepted' ? 'Friends' : 'Not friends yet'} left={data?.person ? <PersonAvatar person={data.person} size={36} /> : undefined}
        onTitlePress={() => r.push({ pathname: '/member/[id]', params: { id: other } })}
        right={<Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => setMenu(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="dots" /></Pressable>} />
      {loading || error ? <View style={{ paddingHorizontal: 20 }}><State loading={loading} error={error} onRetry={reload} /></View> : (<>
        {data?.rel?.status !== 'accepted' && mode !== 'accept' ? (
          <View style={{ margin: 16, padding: 12, borderRadius: radius.control, backgroundColor: colors.goldTint, borderWidth: 1, borderColor: colors.goldBorder }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>Your first message to a stranger also sends a friend request. You get one message until {name} accepts.</Text>
          </View>) : null}
        {mode === 'accept' ? (
          <View style={{ margin: 16, padding: 14, borderRadius: radius.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.goldBorder }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{name} wants to be friends.</Text>
            {data?.rel?.message ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{data.rel.message}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Button label="Accept" loading={busy} onPress={() => respond(true)} style={{ flex: 1, height: 44 }} />
              <Button label="Not now" variant="secondary" disabled={busy} onPress={() => respond(false)} style={{ flex: 1, height: 44 }} />
            </View>
          </View>) : null}
        <FlatList inverted data={msgs} keyExtractor={(m) => m.id} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item: m, index }) => {
            const mine = m.sender_id === member?.id;
            const older = msgs[index + 1];
            return (
              <View>
                {!older || !sameDay(m.created_at, older.created_at) ? <Text style={{ alignSelf: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint, marginVertical: 12 }}>{dayLabel(m.created_at)}</Text> : null}
                <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', marginVertical: 3, backgroundColor: mine ? colors.goldTint : colors.card, borderWidth: 1, borderColor: mine ? colors.goldBorder : colors.line,
                  paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.bubble, borderBottomRightRadius: mine ? 3 : radius.bubble, borderTopLeftRadius: mine ? radius.bubble : 3 }}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink }}>{m.body}</Text>
                </View>
              </View>
            );
          }}
          ListHeaderComponent={mode === 'waiting' ? <Text style={{ alignSelf: 'flex-end', fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginVertical: 6 }}>Sent. Waiting for {first} to accept.</Text> : null}
          ListEmptyComponent={<View style={{ transform: [{ scaleY: -1 }] }}><State empty={`Say hello to ${name}.`} /></View>} />
        {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, paddingHorizontal: 16, paddingBottom: 6 }}>{err}</Text> : null}
        {mode === 'waiting' || mode === 'declined' || mode === 'accept' ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, textAlign: 'center', padding: 16, paddingBottom: insets.bottom + 16 }}>
            {mode === 'declined' ? `${first} declined. You can try again later.` : mode === 'accept' ? `Accept ${first}'s request to reply.` : `You can message again once ${first} accepts.`}</Text>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput accessibilityLabel="Message" value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={colors.faint} multiline maxLength={2000}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 11, fontSize: 16, fontFamily: fonts.body, color: colors.ink }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={!text.trim() || sending} onPress={send}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.5 : 1 }}><Icon name="send" color={colors.onGold} size={20} /></Pressable>
          </View>)}
      </>)}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={`@${name}`}>
        <View style={{ gap: 8 }}>
          <Button label="View profile" variant="secondary" onPress={() => { setMenu(false); r.push({ pathname: '/member/[id]', params: { id: other } }); }} />
          {data?.rel?.status === 'accepted' ? <Button label="Unfriend" variant="secondary" loading={busy} onPress={() => act(() => api.unfriend(other))} /> : null}
          <Button label="Report" variant="secondary" onPress={() => { setMenu(false); setReport(true); }} />
          <Button label="Block" variant="secondary" loading={busy} onPress={() => act(() => api.block(other), () => r.replace('/messages'))} />
          <Button label="Close" variant="link" onPress={() => setMenu(false)} />
        </View>
      </Sheet>
      <ReportSheet member={report && data?.person ? data.person : null} context={data?.dm ? { channel_id: data.dm.channel_id } : undefined} onClose={() => setReport(false)}
        onBlock={() => act(() => api.block(other), () => r.replace('/messages'))} />
    </KeyboardAvoidingView>
  );
}
