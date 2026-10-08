import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bar } from '@/components/Bar';
import { Icon } from '@/components/Icon';
import { LetterBadge, State } from '@/components/lists';
import { Button } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import type { Message, Person, Poll } from '@/lib/api';
import { friendly } from '@/lib/messages';
import { channelFit } from '@/lib/channels';
import { dayLabel, endsIn, pct, sameDay } from '@/lib/format';
import { ReportSheet } from '@/components/ReportSheet';
import { useLoad } from '@/lib/useLoad';
import { supabase } from '@/lib/supabase';

type Item = { kind: 'msg'; at: string; m: Message } | { kind: 'poll'; at: string; p: Poll };

function PollCard({ p, onVote, busy }: { p: Poll; onVote: (optionId: string) => void; busy: boolean }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 14, marginVertical: 6 }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color: colors.goldText }}>POLL</Text>
      <Text style={{ fontFamily: fonts.titleMedium, fontSize: 18, color: colors.ink, marginTop: 4, marginBottom: 10 }}>{p.question}</Text>
      {p.options.map((o) => {
        const mine = p.my_option_id === o.id;
        const share = pct(o.votes, p.total_votes);
        return (
          <Pressable key={o.id} accessibilityRole="button" accessibilityState={{ selected: mine, disabled: !p.is_open || busy }} disabled={!p.is_open || busy} onPress={() => onVote(o.id)}
            style={{ minHeight: 44, marginBottom: 6, borderRadius: radius.control, borderWidth: 1, borderColor: mine ? colors.goldText : colors.line, overflow: 'hidden', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${share}%`, backgroundColor: mine ? colors.goldBorder : colors.goldTint }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: mine ? fonts.bodySemi : fonts.body, fontSize: 15, color: colors.ink }}>{o.label}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted }}>{share}%</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint, marginTop: 4 }}>
        {p.total_votes} {p.total_votes === 1 ? 'vote' : 'votes'}.{p.is_open ? ' Tap another option to change yours.' : ' This poll is closed.'}
      </Text>
    </View>
  );
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const insets = useSafeAreaInsets();
  const { member } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [voting, setVoting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [reporting, setReporting] = useState<Message | null>(null);

  const { data, error, loading, reload, setData } = useLoad(async () => {
    const [channels, messages, polls] = await Promise.all([api.channels(), api.messages(id), api.polls(id)]);
    const channel = channels.find((c) => c.id === id) ?? null;
    const me = await api.myProfileBasics();
    const ids = [...new Set(messages.map((m) => m.sender_id))];
    const people: Record<string, Person> = Object.fromEntries((await api.people(ids)).map((p) => [p.id, p]));
    const expiry = channel?.kind === 'booking' ? (await api.bookingChatExpiry())[id] ?? null : null;
    return { channel, messages, polls, people, expiry, why: channel && !channel.is_member ? channelFit(channel, me) : null };
  }, [id]);

  // live updates: any change to this channel's messages refreshes the list
  useEffect(() => {
    const ch = supabase.channel(`chat:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${id}` }, () => { void reload(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, reload]);

  const items: Item[] = useMemo(() => {
    if (!data) return [];
    const all: Item[] = [...data.messages.map((m) => ({ kind: 'msg' as const, at: m.created_at, m })), ...data.polls.map((p) => ({ kind: 'poll' as const, at: p.created_at, p }))];
    return all.sort((a, b) => b.at.localeCompare(a.at)); // newest first for the inverted list
  }, [data]);

  const channel = data?.channel;
  const isLobby = channel?.kind === 'lobby';
  const canPost = !!channel?.is_member && (!isLobby || member?.role === 'admin');
  const subtitle = channel ? (channel.kind === 'booking' ? endsIn(data!.expiry) : `${channel.member_count} ${channel.member_count === 1 ? 'member' : 'members'}. Tap for settings.`) : null;

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setErr(null);
    try {
      if (editing) await api.editMessage(editing.id, body); else await api.sendMessage(id, body);
      setText(''); setEditing(null); await reload();
    } catch (e) { setErr(friendly(e)); } finally { setSending(false); }
  };
  const vote = async (poll: Poll, option: string) => {
    setVoting(true);
    try { await api.vote(poll.id, option); await reload(); } catch (e) { setErr(friendly(e)); } finally { setVoting(false); }
  };
  const join = async () => { setJoining(true); try { await api.joinChannel(id); await reload(); } catch (e) { setErr(friendly(e)); } finally { setJoining(false); } };
  const remove = async (m: Message) => { setMenu(null); try { await api.removeMessage(m.id); await reload(); } catch (e) { setErr(friendly(e)); } };

  const renderItem = useCallback(({ item, index }: { item: Item; index: number }) => {
    const older = items[index + 1];
    const label = !older || !sameDay(item.at, older.at) ? <Text style={{ alignSelf: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.faint, marginVertical: 12 }}>{dayLabel(item.at)}</Text> : null;
    if (item.kind === 'poll') return <View>{label}<PollCard p={item.p} busy={voting} onVote={(o) => vote(item.p, o)} /></View>;
    const m = item.m;
    const mine = m.sender_id === member?.id;
    const who = data?.people[m.sender_id]?.username ?? (isLobby ? 'The Semi Circle' : 'member');
    return (
      <View>
        {label}
        <Pressable onLongPress={() => setMenu(m)} accessibilityHint="Hold for options" style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', marginVertical: 3 }}>
          {!mine ? <Text accessibilityRole="link" onPress={() => !isLobby && r.push({ pathname: '/member/[id]', params: { id: m.sender_id } })} style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.goldText, marginBottom: 2, marginLeft: 4 }}>{who}</Text> : null}
          <View style={{ backgroundColor: mine ? colors.goldTint : colors.card, borderWidth: 1, borderColor: mine ? colors.goldBorder : colors.line, paddingVertical: 8, paddingHorizontal: 12,
            borderRadius: radius.bubble, borderBottomRightRadius: mine ? 3 : radius.bubble, borderTopLeftRadius: mine ? radius.bubble : 3 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink }}>{m.body}</Text>
            {m.edited_at ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint, marginTop: 2 }}>edited</Text> : null}
          </View>
        </Pressable>
      </View>
    );
  }, [items, member?.id, data?.people, isLobby, voting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Bar title={channel?.name ?? 'Channel'} subtitle={subtitle} left={channel ? <LetterBadge name={channel.name} size={36} /> : undefined}
        onTitlePress={channel && channel.kind !== 'lobby' ? () => r.push({ pathname: '/channel/settings/[id]', params: { id } }) : undefined} />
      {loading || error || !channel ? <View style={{ paddingHorizontal: 20 }}><State loading={loading} error={error ?? (!loading && !channel ? "That channel isn't available." : null)} onRetry={reload} /></View> : (
        <FlatList inverted data={items} keyExtractor={(i) => (i.kind === 'msg' ? i.m.id : i.p.id)} renderItem={renderItem} style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          ListEmptyComponent={<View style={{ transform: [{ scaleY: -1 }] }}><State empty={channel.is_member ? 'No messages yet. Say hello.' : 'Join the channel to read and post.'} /></View>} />
      )}
      {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, paddingHorizontal: 16, paddingBottom: 6 }}>{err}</Text> : null}
      {channel && !channel.is_member && channel.kind === 'public' ? (
        <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
          <Button label="Join channel" onPress={join} loading={joining} disabled={!!data?.why} />
          {data?.why ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 }}>{data.why}</Text> : null}
        </View>
      ) : channel && !canPost ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, textAlign: 'center', padding: 16, paddingBottom: insets.bottom + 16 }}>Only the team posts here. You can vote in polls and read everything.</Text>
      ) : channel ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          {editing ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.goldText }}>Editing message</Text>
              <Text onPress={() => { setEditing(null); setText(''); }} accessibilityRole="button" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted }}>Cancel</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput accessibilityLabel="Message" value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={colors.faint} multiline maxLength={2000}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 16, fontFamily: fonts.body, color: colors.ink }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={!text.trim() || sending} onPress={send}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.5 : 1 }}>
              <Icon name="send" color={colors.onGold} size={20} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(33,28,22,0.4)', justifyContent: 'flex-end' }} onPress={() => setMenu(null)}>
          <View style={{ backgroundColor: colors.ground, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
            {menu && menu.sender_id === member?.id ? (<>
              <Button label="Edit message" variant="secondary" onPress={() => { setEditing(menu); setText(menu.body); setMenu(null); }} />
              <Button label="Delete message" variant="secondary" onPress={() => remove(menu)} />
            </>) : menu ? (<>
              <Button label="Report member" variant="secondary" onPress={() => { setReporting(menu); setMenu(null); }} />
              {member?.role === 'admin' ? <Button label="Remove message" variant="secondary" onPress={() => remove(menu)} /> : null}
            </>) : null}
            <Button label="Close" variant="link" onPress={() => setMenu(null)} />
          </View>
        </Pressable>
      </Modal>
      <ReportSheet member={reporting ? (data?.people[reporting.sender_id] ?? { id: reporting.sender_id, username: 'member' }) : null} context={reporting ? { channel_id: id, message_id: reporting.id } : undefined} onClose={() => setReporting(null)} />
    </KeyboardAvoidingView>
  );
}
