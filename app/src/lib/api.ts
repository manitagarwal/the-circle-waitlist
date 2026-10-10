import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingRow } from './bookings';
import { applicationCode, normalizeEmail } from './validators.ts';

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
export type Message = { id: string; channel_id: string; sender_id: string; body: string; created_at: string; edited_at: string | null; image_path?: string | null };
export type PollOption = { id: string; label: string; votes: number };
export type Poll = { id: string; channel_id: string; question: string; created_at: string; closes_at: string | null; closed_at: string | null; is_open: boolean; total_votes: number; my_option_id: string | null; options: PollOption[] };
export type FoundPerson = Person & { area: string | null };
/** Strips characters that would break a search filter. */
export const cleanSearch = (q: string) => q.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 40);
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
export type DmRow = {
  channel_id: string; other_id: string; username: string; full_name: string | null; avatar_id: number | null; photo_path: string | null;
  friendship_status: 'none' | 'pending' | 'accepted' | 'declined'; requested_by_me: boolean; tab: 'friends' | 'strangers';
  last_body: string | null; last_at: string | null; last_from_me: boolean | null;
};
export type Friendship = { other_id: string; status: 'pending' | 'accepted' | 'declined'; requested_by_me: boolean; message: string | null };
export type HostedBooking = { id: string; title: string; interest_name: string; area: string | null; starts_at: string; status: string; kind: string };
export type Blocked = { id: string; username: string; avatar_id: number | null; photo_path: string | null; blocked_at: string };
export const REPORT_CATEGORIES = [
  { value: 'harassment', label: 'Harassment or inappropriate behaviour' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'repeated_no_shows', label: 'Repeated no-shows' },
  { value: 'other', label: 'Something else' },
] as const;
export type OwnRow = {
  avatar_id: number | null; photo_path: string | null; bio: string | null; dob: string; gender: string; address_text: string;
  lat: number | null; lng: number | null; area: string; field_of_work: string;
};
export type EventRow = {
  id: string; title: string; description: string | null; interest_id: number | null; interest_name: string | null; cover_path: string | null;
  venue_name: string | null; area: string | null; city: string | null; address_text: string | null; starts_at: string; ends_at: string;
  capacity: number | null; price_inr: number; age_min: number | null; age_max: number | null; genders: string[]; cities: string[]; min_score: number | null;
  status: 'published' | 'cancelled'; going_count: number; waitlist_count: number; my_status: 'going' | 'waitlist' | 'cancelled' | 'attended' | 'no_show' | null; my_position: number | null;
};
export type Vouch = { name?: string; email?: string; phone?: string };

/** Pure data layer. Takes the client so it can be tested with a fake. */
export function createApi(sb: SupabaseClient, sbWork: SupabaseClient = sb) {
  const rpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<T> => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    return data as T;
  };
  const ownRow = async (): Promise<{ row: OwnRow; interestIds: number[] }> => {
    const { data: u } = await sb.auth.getUser();
    const uid = u.user?.id;
    if (!uid) throw new Error('not_signed_in');
    const [m, mi] = await Promise.all([
      sb.from('members').select('avatar_id, photo_path, bio, dob, gender, address_text, lat, lng, area, field_of_work').eq('id', uid).single(),
      sb.from('member_interests').select('interest_id').eq('member_id', uid),
    ]);
    if (m.error) throw m.error;
    if (mi.error) throw mi.error;
    return { row: m.data as OwnRow, interestIds: (mi.data as { interest_id: number }[]).map((x) => x.interest_id) };
  };
  return {
    checkDuplicates: (p: { phone?: string; personalEmail?: string; workEmail?: string }) =>
      rpc<Dupes>('check_applicant_duplicates', {
        p_phone: p.phone || null, // already in the stored form, +<code><number>
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
    createGroup: (name: string, members: string[]) => rpc<string>('create_group', { p_name: name, p_members: members }),
    addToGroup: (channel: string, members: string[]) => rpc<number>('add_to_group', { p_channel: channel, p_members: members }),
    joinChannel: (id: string) => rpc<void>('join_channel', { p_channel: id }),
    leaveChannel: (id: string) => rpc<void>('leave_channel', { p_channel: id }),
    closeChannel: (id: string) => rpc<void>('close_channel', { p_channel: id }),
    respondInvite: (id: string, accept: boolean) => rpc<void>('respond_channel_invite', { p_invite: id, p_accept: accept }),
    createChannel: (a: { kind: 'public' | 'private'; name: string; interestId: number | null; tags: { city?: string[]; area?: string; age_min?: string; age_max?: string; gender?: string[] } }) =>
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
    inviteToPublicChannel: (channel: string, invitee: string) => rpc<void>('invite_to_public_channel', { p_channel: channel, p_invitee: invitee }),
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
    /** Age, gender and city of the signed-in member, for "does this fit me?" hints. */
    myProfileBasics: async () => {
      const rows = await rpc<{ age: number | null; gender: string | null; city: string | null }[]>('my_match_profile').catch(() => []);
      const r = rows?.[0];
      return { age: r?.age ?? null, gender: r?.gender ?? null, city: r?.city ?? null };
    },
    bookingMaxDuration: async (interest: number) => (await rpc<number>('booking_max_duration', { p_interest: interest }).catch(() => 360)) as number,
    bookingWindow: async (interest: number) => {
      const rows = await rpc<{ min_hours: number; max_hours: number }[]>('booking_window', { p_interest: interest }).catch(() => []);
      return { min: rows?.[0]?.min_hours ?? 6, max: rows?.[0]?.max_hours ?? 24 };
    },
    myScore: () => rpc<number>('my_score'),
    scoreRules: () => rpc<Record<string, unknown>>('score_rules'),
    noteSignIn: () => rpc<void>('note_sign_in'),
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
    searchMembers: async (q: string, limit = 30) => {
      const term = cleanSearch(q);
      if (term.length < 2) return [] as FoundPerson[];
      const { data, error } = await sb.from('member_profiles').select('id, username, full_name, avatar_id, photo_path, area')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`).limit(limit);
      if (error) throw error;
      return data as FoundPerson[];
    },
    // ---- messages and polls
    messages: async (channel: string, limit = 60) => {
      const { data, error } = await sb.from('messages').select('id, channel_id, sender_id, body, created_at, edited_at, image_path')
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
    // ---- direct messages, friends, blocks, reports
    dms: async () => {
      const { data, error } = await sb.from('my_dms').select('*');
      if (error) throw error;
      return data as DmRow[];
    },
    friendship: async (other: string) => {
      const { data, error } = await sb.from('my_friendships').select('other_id, status, requested_by_me, message').eq('other_id', other).maybeSingle();
      if (error) throw error;
      return data as Friendship | null;
    },
    sendDm: (to: string, body: string) => rpc<{ channel_id?: string }>('send_dm', { p_to: to, p_body: body }),
    sendFriendRequest: (to: string, message: string | null) => rpc<string>('send_friend_request', { p_to: to, p_message: message }),
    unfriend: (member: string) => rpc<void>('unfriend', { p_member: member }),
    block: (member: string) => rpc<void>('block_member', { p_member: member }),
    unblock: (member: string) => rpc<void>('unblock_member', { p_member: member }),
    blocked: () => rpc<Blocked[]>('my_blocked_members'),
    hostedBy: (member: string) => rpc<HostedBooking[]>('member_hosted_bookings', { p_member: member }),
    report: (a: { member: string; category: string; reason: string; safety: boolean; context?: { channel_id?: string; message_id?: string; booking_id?: string } }) =>
      rpc<string>('submit_report', { p_reported: a.member, p_category: a.category, p_reason: a.reason, p_context: a.context ?? {}, p_is_safety: a.safety }),
    // ---- my profile and settings
    ownRow,
    /** Re-saves the whole profile with some fields changed (the backend has one function for it). */
    saveProfile: async (patch: Partial<{ avatarId: number | null; photoPath: string | null; bio: string | null; interestIds: number[]; area: string; field: string }>) => {
      const { row, interestIds } = await ownRow();
      const photo = patch.photoPath !== undefined ? patch.photoPath : row.photo_path;
      const avatar = patch.avatarId !== undefined ? patch.avatarId : row.avatar_id;
      const { error } = await sb.rpc('complete_profile', {
        p_avatar_id: photo ? null : avatar, p_photo_path: photo, p_bio: patch.bio !== undefined ? patch.bio : row.bio, p_dob: row.dob, p_gender: row.gender,
        p_address_text: row.address_text, p_lat: row.lat, p_lng: row.lng, p_area: patch.area ?? row.area, p_field_of_work: patch.field ?? row.field_of_work,
        p_interest_ids: patch.interestIds ?? interestIds,
      });
      if (error) throw error;
    },
    notificationPrefs: async () => {
      const { data, error } = await sb.from('notification_prefs').select('category, enabled');
      if (error) throw error;
      return Object.fromEntries((data as { category: string; enabled: boolean }[]).map((p) => [p.category, p.enabled])) as Record<string, boolean>;
    },
    setUsername: (u: string) => rpc<string>('set_username', { p_username: u }),
    referralCode: () => rpc<string>('my_referral_code'),
    exportData: () => rpc<unknown>('export_my_data'),
    deleteAccount: () => rpc<{ deleted_at: string; erased_after: string }>('delete_my_account'),
    restoreAccount: () => rpc<void>('restore_my_account'),
    moderationStatus: () => rpc<{ state: string; suspended_until: string | null; last_action: string | null }>('my_moderation_status'),
    // ---- events
    events: async () => {
      const { data, error } = await sb.from('events_overview').select('*').order('starts_at');
      if (error) throw error;
      return data as EventRow[];
    },
    event: async (id: string) => {
      const { data, error } = await sb.from('events_overview').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as EventRow | null;
    },
    eventRoster: (id: string) => rpc<{ member_id: string; username: string; avatar_id: number | null; photo_path: string | null }[]>('event_roster', { p_event: id }),
    myTicket: (id: string) => rpc<string | null>('my_ticket', { p_event: id }),
    rsvp: (id: string) => rpc<'going' | 'waitlist'>('rsvp_event', { p_event: id }),
    cancelRsvp: (id: string) => rpc<void>('cancel_rsvp', { p_event: id }),
    // ---- activity
    notifications: async () => {
      const { data, error } = await sb.from('my_notifications').select('*').order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      return data as NotificationRow[];
    },
    unreadCount: () => rpc<number>('unread_notification_count'),
    unreadMessages: () => rpc<{ channel_id: string; kind: string; unread: number }[]>('my_unread'),
    markChannelRead: (channel: string) => rpc<void>('mark_channel_read', { p_channel: channel }),
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
        id: a.id, full_name: a.fullName.trim(), phone: a.phone, personal_email: normalizeEmail(a.personalEmail),
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
