import React, { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArchPhoto } from '@/components/Arch';
import { FadeUp, GrowBar } from '@/components/motion';
import { SectionLabel, State, TabHeader } from '@/components/lists';
import { Button, Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { api, useAuth } from '@/lib/auth';
import { useSignedUrl } from '@/lib/media';
import { useLoad } from '@/lib/useLoad';

const month = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(iso)).toUpperCase();

function Stat({ n, label, onPress }: { n: number | string; label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.ink }}>{n}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textDecorationLine: onPress ? 'underline' : 'none' }}>{label}</Text>
    </Pressable>
  );
}

export default function Profile() {
  const r = useRouter();
  const { member } = useAuth();
  const [copied, setCopied] = useState(false);
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const me = member!.id;
    const [profile, score, code, friends, channels] = await Promise.all([api.profile(me), api.myScore().catch(() => null), api.referralCode().catch(() => null), api.friends(me).catch(() => []), api.channels().catch(() => [])]);
    // Lobbies come with your interests, and booking chats are temporary, so only channels you chose to be in count
    return {
      profile, score, code, friends: friends.length,
      channels: channels.filter((c) => c.is_member && c.kind === 'public').length,
    };
  });
  const p = data?.profile;
  const photo = useSignedUrl(p?.photo_path);
  const link = data?.code ? `${SITE_URL}/?ref=${data.code}` : '';

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Profile" right={
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => r.push('/settings')} style={{ height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Settings</Text></Pressable>} />
      <State loading={loading} error={error} onRetry={reload} />
      {p ? (<>
        <FadeUp distance={40}><View style={{ marginTop: 8 }}><ArchPhoto uri={photo} avatarId={p.avatar_id} size={150} /></View></FadeUp>
        <FadeUp delay={300}>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: colors.ink }}>{p.full_name ?? p.username}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: 2 }}>@{p.username}{member?.role === 'admin' ? ' · Admin' : ''}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' }}>{[p.area, p.field_of_work].filter(Boolean).join(' · ')}</Text>
            {p.bio ? <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 22, color: colors.ink, marginTop: 10, textAlign: 'center' }}>{p.bio}</Text> : null}
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, letterSpacing: 1.4, color: colors.faint, marginTop: 10 }}>MEMBER SINCE {month(p.member_since)}</Text>
          </View>
        </FadeUp>
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Stat n={p.bookings_hosted} label="Hosted" /><Stat n={data!.friends} label="Friends" onPress={() => r.push('/friends')} /><Stat n={data!.channels} label="Channels" />
        </View>

        {data!.score != null ? (<>
          <SectionLabel info="Only you can see this. It goes up when you show up, and down when you cancel late or don't show.">Your reliability</SectionLabel>
          <View style={{ padding: 14, backgroundColor: colors.surface, borderRadius: radius.card }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 35, color: colors.ink }}>{Number(data!.score).toFixed(1)} <Text style={{ fontSize: 19, color: colors.muted, letterSpacing: 0 }}>/ 10</Text></Text>
            <View style={{ marginTop: 8 }}><GrowBar pct={Number(data!.score) * 10} color={colors.gold} track={colors.lineStrong} /></View>
          </View>
        </>) : null}

        {data!.code ? (<>
          <SectionLabel info="Private to you. Share your link to vouch for someone you know.">Referral code</SectionLabel>
          <View style={{ padding: 14, backgroundColor: colors.surface, borderRadius: radius.card }}>
            <Text selectable style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: 4, color: colors.ink }}>{data!.code}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" onPress={async () => { await Clipboard.setStringAsync(link); setCopied(true); }} style={{ flex: 1, height: 44 }} />
              <Button label="Share" variant="secondary" onPress={() => Share.share({ message: `I'm on The Semi Circle, a private community that's by invitation only. I can vouch for you: ${link}` })} style={{ flex: 1, height: 44 }} />
            </View>
          </View>
        </>) : null}

        {p.interests?.length ? (<>
          <SectionLabel>Into</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.interests.map((i) => <Text key={i} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden' }}>{i}</Text>)}
          </View>
        </>) : null}
        <View style={{ height: 24 }} />
      </>) : null}
    </Screen>
  );
}
