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
