/** What the message box may do, from the friendship and how many messages I already sent since the request. */
export function composerState(rel: { status: string; requested_by_me: boolean } | null, sentSinceRequest: number): 'open' | 'first' | 'waiting' | 'accept' | 'declined' {
  if (!rel) return 'first';
  if (rel.status === 'accepted') return 'open';
  if (rel.status === 'pending') return rel.requested_by_me ? (sentSinceRequest >= 1 ? 'waiting' : 'first') : 'accept';
  return rel.requested_by_me ? 'declined' : 'first';
}
