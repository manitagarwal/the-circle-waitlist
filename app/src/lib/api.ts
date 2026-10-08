import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from './bookings';
import { applicationCode, normalizeEmail, normalizePhone } from './validators.ts';

export type Dupes = { phone?: boolean; personal_email?: boolean; work_email?: boolean };
export type ApplicationInput = {
  id: string; fullName: string; phone: string; personalEmail: string; workEmail: string;
  linkedin: string; city: string; referredByCode?: string;
};
export type Application = {
  id: string; full_name: string; status: string; city: string; created_at: string;
  queue_position: number | null; referral_code: string;
};

export type ChannelRow = {
  id: string; kind: 'lobby' | 'public' | 'private' | 'booking' | 'dm'; name: string; photo_path: string | null;
  interest_id: number | null; interest_name: string | null; created_by: string | null; created_at: string;
  member_count: number; is_member: boolean; my_role: string | null; tags: { type: string; value: string }[];
};
export type ChannelPreview = { channel_id: string; body: string; last_at: string; sender_username: string | null; from_me: boolean };
export type ChannelInvite = { id: string; channel_id: string; channel_name: string; inviter_username: string; created_at: string };
export type Message = { id: string; channel_id: string; sender_id: string; body: string; created_at: string; edited_at: string | null };
export type PollOption = { id: string; label: string; votes: number };
export type Poll = { id: string; channel_id: string; question: string; created_at: string; closes_at: string | null; closed_at: string | null; is_open: boolean; total_votes: number; my_option_id: string | null; options: PollOption[] };
export type Person = { id: string; username: string; full_name: string | null; avatar_id: number | null; photo_path: string | null };
export type NotificationRow = { id: string; type: string; payload: Record<string, any>; read_at: string | null; is_unread: boolean; created_at: string };
export type RosterEntry = { member_id: string; username: string; avatar_id: number | null; photo_path: string | null; status: string; is_host: boolean };
export type Profile = {
  id: string; username: string; full_name: string | null; avatar_id: number | null; photo_path: string | null; bio: string | null; age: number | null;
  gender: string | null; area: string | null; field_of_work: string | null; member_since: string; interests: string[] | null; bookings_hosted: number;
};
export type BookingInput = {
  interestId: number; title: string; description: string | null; venue: string; area: string; address: string; startsAt: string; endsAt: string;
  headcountMax: number; maleSlots: number | null; femaleSlots: number | null; minScore: number | null; ageMin: number | null; ageMax: number | null;
};
export type Vouch = { name?: string; email?: string; phone?: string };

/** Pure data layer. Takes the client so it can be tested with a fake. */
export function createApi(sb: SupabaseClient, sbWork: SupabaseClient = sb) {
  const rpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<T> => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    return data as T;
  };
  return {
    checkDuplicates: (p: { phone?: string; personalEmail?: string; workEmail?: string }) =>
      rpc<Dupes>('check_applicant_duplicates', {
        p_phone: p.phone ? normalizePhone(p.phone) : null,
        p_personal_email: p.personalEmail ? normalizeEmail(p.personalEmail) : null,
        p_work_email: p.workEmail ? normalizeEmail(p.workEmail) : null,
      }),
    sendCode: async (email: string, createUser: boolean) => {
      const { error } = await sb.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: createUser } });
      if (error) throw error;
    },
    verifyCode: async (email: string, token: string) => {
      const { error } = await sb.auth.verifyOtp({ email: normalizeEmail(email), token, type: 'email' });
      if (error) throw error;
    },
    /** Work email: proven with a code through a separate, throwaway client. */
    sendWorkCode: async (email: string) => {
      const { error } = await sbWork.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    verifyWorkCode: async (email: string, token: string) => {
      const { error } = await sbWork.auth.verifyOtp({ email: normalizeEmail(email), token, type: 'email' });
      if (error) throw error;
      await sbWork.auth.signOut({ scope: 'local' }); // discard that session; only the proof matters
    },
    usernameAvailable: (u: string) => rpc<string>('username_available', { p_username: u }),
    activate: (username: string) => rpc<{ member_id: string; username: string }>('activate_membership', { p_username: username }),
    interestGroups: async () => {
      const [g, i] = await Promise.all([
        sb.from('interest_groups').select('id, name, sort').order('sort'),
        sb.from('interests').select('id, name, group_id').eq('is_active', true).order('name'),
      ]);
      if (g.error) throw g.error;
      if (i.error) throw i.error;
      return (g.data as { id: number; name: string; sort: number }[]).map((grp) => ({
        ...grp, interests: (i.data as { id: number; name: string; group_id: number }[]).filter((x) => x.group_id === grp.id),
      }));
    },
    uploadProfilePhoto: async (uid: string, bytes: ArrayBuffer) => {
      const path = `${uid}/${Date.now()}.jpg`;
      const { error } = await sb.storage.from('profile-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      return path;
    },
    completeProfile: async (args: Record<string, unknown>) => {
      const { error } = await sb.rpc('complete_profile', args);
      if (error) throw error;
    },
    setNotificationPref: async (category: string, enabled: boolean) => {
      const { error } = await sb.rpc('set_notification_pref', { p_category: category, p_enabled: enabled });
      if (error) throw error;
    },
    registerPushToken: async (token: string, platform: string) => {
      const { error } = await sb.rpc('register_push_token', { p_token: token, p_platform: platform });
      if (error) throw error;
    },
    // ---- channels
    channels: async () => {
      const { data, error } = await sb.from('channels_overview').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as ChannelRow[];
    },
    bookingChatExpiry: async () => {
      const { data, error } = await sb.from('channels').select('id, expires_at').eq('kind', 'booking').is('deleted_at', null);
      if (error) throw error;
      return Object.fromEntries((data as { id: string; expires_at: string | null }[]).map((c) => [c.id, c.expires_at]));
    },
    channelPreviews: () => rpc<ChannelPreview[]>('my_channel_previews'),
    channelInvites: () => rpc<ChannelInvite[]>('my_channel_invites'),
    joinChannel: (id: string) => rpc<void>('join_channel', { p_channel: id }),
    leaveChannel: (id: string) => rpc<void>('leave_channel', { p_channel: id }),
    closeChannel: (id: string) => rpc<void>('close_channel', { p_channel: id }),
    respondInvite: (id: string, accept: boolean) => rpc<void>('respond_channel_invite', { p_invite: id, p_accept: accept }),
    createChannel: (a: { kind: 'public' | 'private'; name: string; interestId: number | null; tags: Record<string, string> }) =>
      rpc<string>('create_channel', { p_kind: a.kind, p_name: a.name, p_interest_id: a.interestId, p_photo_path: null, p_tags: a.tags }),
    renameChannel: (id: string, name: string) => rpc<void>('update_channel', { p_channel: id, p_name: name, p_photo_path: null }),
    inviteToChannel: (channel: string, invitee: string) => rpc<void>('invite_to_channel', { p_channel: channel, p_invitee: invitee }),
    removeChannelMember: (channel: string, member: string) => rpc<void>('remove_channel_member', { p_channel: channel, p_member: member }),
    setChannelAdmin: (channel: string, member: string, isAdmin: boolean) => rpc<void>('set_channel_admin', { p_channel: channel, p_member: member, p_is_admin: isAdmin }),
    roster: async (channel: string) => {
      const { data, error } = await sb.from('channel_members').select('member_id, role').eq('channel_id', channel);
      if (error) throw error;
      return data as { member_id: string; role: string }[];
    },
    friends: (me: string) => rpc<Person[]>('member_friends', { p_member: me }),
    // ---- bookings
    bookingsUpcoming: async () => {
      const { data, error } = await sb.from('bookings_overview').select('*').in('status', ['open', 'full']).gt('ends_at', new Date().toISOString()).order('starts_at');
      if (error) throw error;
      return data as BookingRow[];
    },
    bookingsMine: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await sb.from('bookings_overview').select('*').or('is_host.eq.true,my_status.not.is.null').gte('ends_at', since).order('starts_at', { ascending: false });
      if (error) throw error;
      return data as BookingRow[];
    },
    booking: async (id: string) => {
      const { data, error } = await sb.from('bookings_overview').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as BookingRow | null;
    },
    bookingRoster: (id: string) => rpc<RosterEntry[]>('booking_roster', { p_booking: id }),
    joinBooking: (id: string) => rpc<void>('join_booking', { p_booking: id }),
    leaveBooking: (id: string) => rpc<void>('leave_booking', { p_booking: id }),
    cancelBooking: (id: string) => rpc<void>('cancel_booking', { p_booking: id }),
    createBooking: (b: BookingInput) => rpc<string>('create_booking', {
      p_interest_id: b.interestId, p_title: b.title, p_description: b.description, p_venue_name: b.venue, p_area: b.area, p_address_outer: b.address,
      p_lat: null, p_lng: null, p_starts_at: b.startsAt, p_ends_at: b.endsAt, p_headcount_min: null, p_headcount_max: b.headcountMax,
      p_male_slots: b.maleSlots, p_female_slots: b.femaleSlots, p_min_score: b.minScore, p_age_min: b.ageMin, p_age_max: b.ageMax, p_as_admin: false,
    }),
    markAttendance: (booking: string, member: string, attended: boolean) => rpc<void>('mark_attendance', { p_booking: booking, p_member: member, p_attended: attended }),
    keepBookingChat: (booking: string) => rpc<void>('continue_booking_channel', { p_booking: booking }),
    /** Age and gender of the signed-in member, for "can I join this?" hints. */
    myProfileBasics: async () => {
      const { data: u } = await sb.auth.getUser();
      const id = u.user?.id;
      if (!id) return { age: null as number | null, gender: null as string | null };
      const { data } = await sb.from('member_profiles').select('age, gender').eq('id', id).maybeSingle();
      return { age: (data?.age as number | null) ?? null, gender: (data?.gender as string | null) ?? null };
    },
    myScore: () => rpc<number>('my_score'),
    profile: async (id: string) => {
      const { data, error } = await sb.from('member_profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    // ---- people
    people: async (ids: string[]) => {
      if (!ids.length) return [] as Person[];
      const { data, error } = await sb.from('member_profiles').select('id, username, full_name, avatar_id, photo_path').in('id', ids);
      if (error) throw error;
      return data as Person[];
    },
    // ---- messages and polls
    messages: async (channel: string, limit = 60) => {
      const { data, error } = await sb.from('messages').select('id, channel_id, sender_id, body, created_at, edited_at')
        .eq('channel_id', channel).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data as Message[]; // newest first
    },
    sendMessage: (channel: string, body: string) => rpc<string>('send_message', { p_channel: channel, p_body: body }),
    editMessage: (id: string, body: string) => rpc<void>('edit_message', { p_message: id, p_body: body }),
    removeMessage: (id: string) => rpc<void>('remove_message', { p_message: id }),
    polls: async (channel: string) => {
      const { data, error } = await sb.from('polls_overview').select('*').eq('channel_id', channel).order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return data as Poll[];
    },
    vote: (poll: string, option: string) => rpc<void>('vote_poll', { p_poll: poll, p_option: option }),
    // ---- activity
    notifications: async () => {
      const { data, error } = await sb.from('my_notifications').select('*').order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      return data as NotificationRow[];
    },
    unreadCount: () => rpc<number>('unread_notification_count'),
    markRead: (id: string) => rpc<void>('mark_notification_read', { p_id: id }),
    markAllRead: () => rpc<number>('mark_all_notifications_read'),
    respondFriend: (from: string, accept: boolean) => rpc<void>('respond_friend_request', { p_from: from, p_accept: accept }),
    hasPassword: () => rpc<boolean>('has_password'),
    myApplication: async (): Promise<Application | null> => {
      const rows = await rpc<Application[]>('my_application');
      return rows?.[0] ?? null;
    },
    submitApplication: async (a: ApplicationInput, vouches: Vouch[]) => {
      let referred: string | null = null;
      if (a.referredByCode) referred = await rpc<string | null>('resolve_referral_code', { p_code: applicationCode(a.referredByCode) });
      const { error } = await sb.from('applicants').insert({
        id: a.id, full_name: a.fullName.trim(), phone: normalizePhone(a.phone), personal_email: normalizeEmail(a.personalEmail),
        work_email: normalizeEmail(a.workEmail), linkedin_url: a.linkedin.trim(), city: a.city, referred_by_id: referred,
      });
      if (error) throw error;
      if (vouches.length) {
        // non-fatal, as on the website
        await sb.from('referrals').insert(vouches.map((v) => ({ applicant_id: a.id, name: v.name || null, email: v.email || null, phone: v.phone || null })));
      }
    },
  };
}
export type Api = ReturnType<typeof createApi>;
