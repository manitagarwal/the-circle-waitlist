import React, { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArchPhoto } from '@/components/Arch';
import { Icon } from '@/components/Icon';
import { FadeUp, GrowBar } from '@/components/motion';
import { SectionLabel, State, TabHeader } from '@/components/lists';
import { Button, Screen } from '@/components/ui';
import { colors, fonts, isDark, radius } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { api, useAuth } from '@/lib/auth';
import { useSignedUrl } from '@/lib/media';
import { PRIVACY_FIELDS } from '@/lib/privacy';
import { toneFor } from '@/lib/tones';
import { useLoad } from '@/lib/useLoad';

const month = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(iso));

function Stat({ n, label, onPress }: { n: number | string; label: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.ink }}>{n}</Text>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.muted, marginTop: 2 }}>{label}</Text>
    </Pressable>
  );
}

const Tag = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 12, overflow: 'hidden' }}>{children}</Text>
);

export default function Profile() {
  const r = useRouter();
  const { member } = useAuth();
  const [copied, setCopied] = useState(false);
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const me = member!.id;
    const [profile, score, code, friends, channels, privacy] = await Promise.all([api.profile(me), api.myScore().catch(() => null), api.referralCode().catch(() => null), api.friends(me).catch(() => []), api.channels().catch(() => []), api.myPrivacy().catch(() => ({}))]);
    // Lobbies you join yourself are not counted here; booking chats are temporary, so only channels you chose to be in
    return { profile, score, code, friends: friends.length, channels: channels.filter((c) => c.is_member && c.kind === 'public').length, hidden: Object.values(privacy).filter(Boolean).length };
  });
  const p = data?.profile;
  const photo = useSignedUrl(p?.photo_path);
  const link = data?.code ? `${SITE_URL}/?ref=${data.code}` : '';
  const ring = toneFor(p?.interests?.[0], isDark) ?? colors.plate;

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <TabHeader title="Profile" right={
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => r.push('/settings')} style={{ height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Settings</Text></Pressable>} />
      <State loading={loading} error={error} onRetry={reload} />
      {p ? (<>
        <FadeUp distance={30}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <View style={{ padding: 6, borderRadius: 90, backgroundColor: ring }}><ArchPhoto uri={photo} avatarId={p.avatar_id} size={150} /></View>
          </View>
        </FadeUp>
        <FadeUp delay={200}>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 42, color: colors.ink, textAlign: 'center' }}>{p.full_name ?? p.username}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: 2 }}>@{p.username}{member?.role === 'admin' ? ' · Admin' : ''}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              {[p.age != null ? `${p.age}` : null, p.area, p.field_of_work].filter((x): x is string => !!x).map((t) => <Tag key={t}>{t}</Tag>)}
            </View>
            {p.bio ? <Text style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink, marginTop: 14, textAlign: 'center' }}>{p.bio}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <Button label="Edit profile" variant="secondary" onPress={() => r.push('/settings/profile')} style={{ flex: 1, height: 46 }} />
            <Button label={data!.hidden ? `What others see · ${data!.hidden} hidden` : 'What others see'} variant="secondary" onPress={() => r.push('/settings/privacy')} style={{ flex: 1.4, height: 46 }} />
          </View>
        </FadeUp>

        <View style={{ flexDirection: 'row', marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }}>
          <Stat n={p.bookings_hosted ?? 0} label="Hosted" /><Stat n={data!.friends} label="Friends" onPress={() => r.push('/friends')} /><Stat n={data!.channels} label="Channels" />
        </View>
        {p.member_since ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.faint, textAlign: 'center', marginTop: 12 }}>Member since {month(p.member_since)}</Text> : null}

        <Pressable onPress={() => r.push('/history')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>Your history</Text>
          <Icon name="chevron" size={18} color={colors.faint} />
        </Pressable>

        {data!.score != null ? (<>
          <SectionLabel info="Only you can see this.">Your reliability</SectionLabel>
          <Pressable accessibilityRole="button" accessibilityLabel="Your reliability. How it works" onPress={() => r.push('/reliability')} style={{ padding: 16, backgroundColor: colors.surface, borderRadius: radius.card }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 35, color: colors.ink }}>{Number(data!.score).toFixed(1)} <Text style={{ fontSize: 19, color: colors.muted }}>/ 10</Text></Text>
            <View style={{ marginTop: 8 }}><GrowBar pct={Number(data!.score) * 10} color={colors.ink} track={colors.lineStrong} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>How it works</Text>
              <Icon name="chevron" size={18} color={colors.faint} />
            </View>
          </Pressable>
        </>) : null}

        {p.interests?.length ? (<>
          <SectionLabel>Your activities</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.interests.map((i) => <Text key={i} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22, backgroundColor: toneFor(i, isDark) ?? colors.surface, overflow: 'hidden' }}>{i}</Text>)}
          </View>
          <Text accessibilityRole="button" onPress={() => r.push('/settings/interests')} style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, textDecorationLine: 'underline', marginTop: 12, alignSelf: 'flex-start' }}>Change activities</Text>
        </>) : null}

        {data!.code ? (<>
          <SectionLabel info="Private to you. Share your link to vouch for someone you know.">Referral code</SectionLabel>
          <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: radius.card }}>
            <Text selectable style={{ fontFamily: fonts.display, fontSize: 30, letterSpacing: 4, color: colors.ink }}>{data!.code}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Button label={copied ? 'Copied' : 'Copy link'} variant="secondary" onPress={async () => { await Clipboard.setStringAsync(link); setCopied(true); }} style={{ flex: 1, height: 44 }} />
              <Button label="Share" variant="secondary" onPress={() => Share.share({ message: `I'm on The Semi Circle, a private community that's by invitation only. I can vouch for you: ${link}` })} style={{ flex: 1, height: 44 }} />
            </View>
          </View>
        </>) : null}
        <View style={{ height: 24 }} />
      </>) : null}
    </Screen>
  );
}
