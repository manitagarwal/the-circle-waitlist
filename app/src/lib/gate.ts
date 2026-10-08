export type Gate = 'loading' | 'public' | 'apply' | 'password' | 'review' | 'accepted' | 'setup' | 'app' | 'closed' | 'banned';

/**
 * Where a person stands, from what we know about their account.
 * A password is mandatory: anyone who has applied or joined but has none is stopped at 'password'.
 * (While applying, the password is part of the application flow itself, so 'apply' comes first.)
 */
export function computeGate(i: {
  ready: boolean; signedIn: boolean; member: { onboarded_at: string | null; state?: string } | null;
  applicationStatus: string | null; hasPassword: boolean;
}): Gate {
  if (!i.ready) return 'loading';
  if (!i.signedIn) return 'public';
  if (i.member?.state === 'banned') return 'banned';
  if (i.member?.state === 'deleted') return 'closed';
  if (i.member) return !i.hasPassword ? 'password' : i.member.onboarded_at ? 'app' : 'setup';
  if (!i.applicationStatus) return 'apply';
  if (!i.hasPassword) return 'password';
  return i.applicationStatus === 'accepted' ? 'accepted' : 'review';
}
