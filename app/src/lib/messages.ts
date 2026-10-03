const MAP: Record<string, string> = {
  invalid_invitation: "That code doesn't match this email. Check it and try again.",
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
  if (/rate limit|too many/i.test(raw)) return 'Too many tries. Wait a minute and try again.';
  if (/invalid login|invalid credentials/i.test(raw)) return "That email and password don't match.";
  if (/token has expired|invalid.*(token|otp)|otp/i.test(raw)) return 'That code is wrong or has expired.';
  if (/network|fetch/i.test(raw)) return "Can't reach the server. Check your connection.";
  return 'Something went wrong. Try again.';
}

export const usernameStatusText = (s: string) =>
  s === 'ok' ? null : (MAP[`username_${s}`] ?? MAP.username_invalid);
