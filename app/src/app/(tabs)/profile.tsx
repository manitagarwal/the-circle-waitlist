import React, { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Avatar } from '@/components/Avatar';
import { SectionLabel, State, TabHeader } from '@/components/lists';
import { Button, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { api, useAuth } from '@/lib/auth';
import { useSignedUrl } from '@/lib/media';
import { useLoad } from '@/lib/useLoad';

const month = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(iso)).toUpperCase();

function Stat({ n, label, note }: { n: number | string; label: string; note?: string | null }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink }}>{n}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{label}</Text>
      {note ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.goldText, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

export default function Profile() {
  const r = useRouter();
  const { member } = useAuth();
  const [copied, setCopied] = useState(false);
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const me = member!.id;
    const [profile, score, code, friends, channels, mine] = await Promise.all([api.profile(me), api.myScore().catch(() => null), api.referralCode().catch(() => null), api.friends(me).catch(() => []), api.channels().catch(() => []), api.bookingsMine().catch(() => [])]);
    const now = Date.now();
    // Lobbies come with your interests, and booking chats are temporary, so only channels you chose to be in count
    return {
      profile, score, code, friends: friends.length,
      channels: channels.filter((c) => c.is_member && c.kind === 'public').length,
      groups: channels.filter((c) => c.is_member && c.kind === 'private').length,
      upcomingHosting: mine.filter((b) => b.is_host && b.kind === 'member' && (b.status === 'open' || b.status === 'full') && Date.parse(b.ends_at) > now).length,
    };
  });
  const p = data?.profile;
  const photo = useSignedUrl(p?.photo_path);
  const link = data?.code ? `${SITE_URL}/?ref=${data.code}` : '';

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Profile" right={
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => r.push('/settings')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.goldText }}>Settings</Text></Pressable>} />
      <State loading={loading} error={error} onRetry={reload} />
      {p ? (<>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Avatar uri={photo} avatarId={p.avatar_id} size={112} />
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, color: colors.goldText, marginTop: 12 }}>THE SEMI CIRCLE  ·  {member?.role === 'admin' ? 'ADMIN' : 'MEMBER'}</Text>
          <Text style={{ fontFamily: fonts.title, fontSize: 26, color: colors.ink, marginTop: 4 }}>{p.full_name ?? p.username}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted }}>@{p.username}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center' }}>{[p.area, p.field_of_work].filter(Boolean).join('. ')}</Text>
          {p.bio ? <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink, marginTop: 10, textAlign: 'center' }}>{p.bio}</Text> : null}
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.4, color: colors.faint, marginTop: 10 }}>MEMBER SINCE {month(p.member_since)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Stat n={p.bookings_hosted} label="Hosted" note={data!.upcomingHosting ? `${data!.upcomingHosting} coming up` : null} /><Stat n={data!.friends} label="Friends" /><Stat n={data!.channels} label="Channels" /><Stat n={data!.groups} label="Groups" />
        </View>

        {data!.score != null ? (<>
          <SectionLabel>Your reliability</SectionLabel>
          <View style={{ padding: 14, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ fontFamily: fonts.title, fontSize: 30, color: colors.ink }}>{Number(data!.score).toFixed(1)} <Text style={{ fontSize: 16, color: colors.muted }}>/ 10</Text></Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 }}>Only you can see this. It goes up when you show up, and down when you cancel late or don't.</Text>
          </View>
        </>) : null}

        {data!.code ? (<>
          <SectionLabel>Your referral code, private to you</SectionLabel>
          <View style={{ padding: 14, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line }}>
            <Text selectable style={{ fontFamily: fonts.title, fontSize: 26, letterSpacing: 4, color: colors.ink }}>{data!.code}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" onPress={async () => { await Clipboard.setStringAsync(link); setCopied(true); }} style={{ flex: 1, height: 44 }} />
              <Button label="Share" variant="secondary" onPress={() => Share.share({ message: `I'm on The Semi Circle, a private community that's by invitation only. I can vouch for you: ${link}` })} style={{ flex: 1, height: 44 }} />
            </View>
          </View>
        </>) : null}

        {p.interests?.length ? (<>
          <SectionLabel>Into</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.interests.map((i) => <Text key={i} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.goldTint, borderWidth: 1, borderColor: colors.goldBorder }}>{i}</Text>)}
          </View>
        </>) : null}
        <View style={{ height: 24 }} />
      </>) : null}
    </Screen>
  );
}
