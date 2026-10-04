export type Gate = 'loading' | 'public' | 'apply' | 'review' | 'accepted' | 'setup' | 'app';

/** Where a person stands, from what we know about their account. */
export function computeGate(i: {
  ready: boolean; signedIn: boolean; member: { onboarded_at: string | null } | null; applicationStatus: string | null;
}): Gate {
  if (!i.ready) return 'loading';
  if (!i.signedIn) return 'public';
  if (i.member) return i.member.onboarded_at ? 'app' : 'setup';
  if (!i.applicationStatus) return 'apply';
  return i.applicationStatus === 'accepted' ? 'accepted' : 'review';
}
