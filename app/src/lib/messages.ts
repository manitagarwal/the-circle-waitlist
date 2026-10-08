const MAP: Record<string, string> = {
  interests_count: 'Pick 3 to 5 interests.',
  interest_invalid: 'One of those interests is no longer available. Pick again.',
  underage: 'You must be 18 or over.',
  too_young: 'You must be 18 or over.',
  dob_required: 'Enter your date of birth.',
  gender_required: 'Pick an option for gender.',
  address_required: 'Tell us where you live.',
  area_required: 'Add the area others will see.',
  field_of_work_required: 'Add your field of work.',
  photo_or_avatar_required: 'Upload a photo or choose an avatar.',
  photo_invalid: "That photo couldn't be saved. Try another.",
  not_a_member: 'Your membership is not active.',
  // bookings
  age_not_allowed: "This one's set for a different age range.",
  booking_full: 'This booking is full.',
  booking_closed: 'This booking has closed.',
  booking_not_found: "That booking isn't available.",
  gender_slot_unavailable: 'The spots for your gender are already taken.',
  score_too_low: "This booking is for members with a higher reliability score.",
  already_joined: "You're already in.",
  cannot_join: "You can't join this booking.",
  host_must_cancel: 'Hosts cancel the booking instead of leaving it.',
  not_joined: "You're not in this booking.",
  hosting_limit: "You've reached your limit of open bookings. Finish or cancel one first.",
  daily_booking_limit: "That's your limit of bookings for today.",
  outside_booking_window: 'Pick a start time between 6 and 24 hours from now.',
  duration_too_long: "That's longer than this kind of booking can run.",
  end_not_half_hour: 'End on the hour or half hour.',
  start_not_half_hour: 'Start on the hour or half hour.',
  time_invalid: 'The end has to be after the start.',
  title_invalid: 'Give it a title of 3 to 80 characters.',
  headcount_invalid: 'A booking needs at least 2 people.',
  age_range_invalid: 'The oldest age has to be at least the youngest.',
  slots_invalid: 'Those spots add up wrong. Try again.',
  min_score_invalid: "That reliability setting isn't valid.",
  message_blocked: "That wording isn't allowed here.",
  not_markable_yet: 'You can mark attendance once it has finished.',
  not_markable: "That guest can't be marked.",
  booking_not_finished: "That booking hasn't finished yet.",
  channel_expired: 'That chat has already closed.',
  channel_limit: 'You have two channels open. Get one to 50 members and you can open a third.',
  // channels and messages
  city_not_matched: 'This channel is for members in other cities.',
  gender_not_matched: "This channel is set up for a different group of members.",
  age_not_matched: "You're outside this channel's age range.",
  age_invalid: 'Check the ages. They run from 18 to 99.',
  gender_invalid: 'Pick from the gender options.',
  tag_invalid: 'One of those details is too long.',
  channel_not_joinable: "You can't join that channel.",
  lobby_read_only: 'Only the team posts in a Lobby.',
  message_invalid: 'Write something first (up to 2000 characters).',
  not_in_channel: "You're not in that channel.",
  name_invalid: 'Use a name of 3 to 50 characters.',
  profile_incomplete: 'Finish your profile first.',
  poll_closed: 'That poll has closed.',
  invite_not_found: 'That invitation is no longer there.',
  cannot_invite: "You can't invite that person.",
  // friends, messages, reports
  accept_request_first: 'Accept their request before you reply.',
  dm_limit_until_accepted: 'Only one message until they accept your request.',
  request_declined: 'They declined. You can try again later.',
  cannot_message: "You can't message this member.",
  cannot_message_self: "That's you.",
  request_cooldown: 'Please wait before asking again.',
  request_pending: 'You already sent a request.',
  already_friends: "You're already friends.",
  cannot_request: "You can't send this member a request.",
  request_not_found: 'That request is no longer there.',
  already_reported: "You've already reported this member for this.",
  report_limit: "You've reached today's limit of reports.",
  reason_required: 'Tell us what happened.',
  category_invalid: 'Pick a reason.',
  not_allowed: "You can't do that.",
  username_cooldown: 'You can change your username once every 30 days.',
  photo_limit: "That's the maximum number of photos.",
  last_admin: 'You are the last admin, so this account cannot be deleted.',
  not_accepted: "Your application hasn't been accepted yet.",
  already_member: "You're already a member. Log in instead.",
  not_signed_in: 'Your session ended. Please sign in again.',
  username_taken: 'That username is taken.',
  username_invalid: 'Lowercase letters, numbers, dot and underscore. 3 to 20 characters.',
  username_reserved: "That username isn't available.",
};

/** Turn a Supabase/Postgres error into brand-voice copy. */
export function friendly(err: unknown): string {
  const raw = (err as { message?: string } | null)?.message ?? '';
  if (MAP[raw]) return MAP[raw]; // exact error codes first, so one code never matches inside another
  for (const k of Object.keys(MAP)) if (raw.includes(k)) return MAP[k];
  const wait = raw.match(/after (\d+) seconds/i);
  if (wait) return `Please wait ${wait[1]} seconds before asking for another code.`;
  if (/rate limit|too many|over_email_send_rate_limit/i.test(raw)) return "We've sent a lot of codes just now. Wait a few minutes and try again.";
  if (/invalid login|invalid credentials/i.test(raw)) return "That email and password don't match.";
  if (/token has expired|invalid.*(token|otp)|otp/i.test(raw)) return 'That code is wrong or has already been used. Use the newest code in your inbox.';
  if (/network|fetch/i.test(raw)) return "Can't reach the server. Check your connection.";
  // Keep the real reason visible while we are still testing, so it can be reported.
  return raw ? `Something went wrong. Try again. (${raw.slice(0, 140)})` : 'Something went wrong. Try again.';
}

export const usernameStatusText = (s: string) =>
  s === 'ok' ? null : (MAP[`username_${s}`] ?? MAP.username_invalid);
