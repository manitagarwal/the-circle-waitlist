// The reliability score, written exactly as the database computes it (migration 038a, function calc_score).
//
//   decay      d(age)  = 0.5 ^ (age / halfLife)                       old events fade smoothly
//   good       P       = sum(weight * d)  +  min(cap, signInWeight * sum(d of sign-in days))
//   mistakes   Q       = sum(|weight| * d * m)
//     m for a no-show or late cancel = g / (1 + G / cushion)
//         g = graceFactor if it is the first such mistake in the grace window, else 1
//         G = good events (attended or hosted) in the grace window before it
//     m for an early cancel          = 1 / (1 + G / cushion)
//     m for a host's late cancel, a host no-show, an upheld report = 1
//   score      S       = 10 * (P + priorGood) / (P + Q + priorWeight)     priorGood = priorWeight * newMemberDefault / 10
//
// The examples shown in the app are computed with this same function, so they cannot drift from the real thing.

export type ScoreRules = {
  halfLife: number; graceWindow: number; graceFactor: number; cushion: number; priorWeight: number; newMember: number;
  signInWeight: number; signInCap: number; weights: Record<string, number>;
};

export const DEFAULT_RULES: ScoreRules = {
  halfLife: 90, graceWindow: 180, graceFactor: 0.5, cushion: 4, priorWeight: 5, newMember: 8, signInWeight: 0.02, signInCap: 1,
  weights: { attended: 1, hosted: 1.5, early_cancel: -0.3, late_cancel: -1.5, no_show: -3, host_late_cancel: -6, host_no_show: -10, report_minor: -2, report_severe: -5 },
};

/** Builds the rules from what the server sends (`score_rules()`), falling back to the defaults. */
export function rulesFrom(raw: Record<string, unknown> | null | undefined): ScoreRules {
  const n = (k: string, d: number) => { const v = Number(raw?.[k]); return Number.isFinite(v) && raw?.[k] != null ? v : d; };
  const d = DEFAULT_RULES;
  return {
    halfLife: n('score.half_life_days', d.halfLife), graceWindow: n('score.grace_window_days', d.graceWindow), graceFactor: n('score.grace_factor', d.graceFactor),
    cushion: n('score.cushion_divisor', d.cushion), priorWeight: n('score.prior_weight', d.priorWeight), newMember: n('score.new_member_default', d.newMember),
    signInWeight: n('score.signin_weight', d.signInWeight), signInCap: n('score.signin_cap', d.signInCap),
    weights: Object.fromEntries(Object.entries(d.weights).map(([k, v]) => [k, n(`score.weight.${k}`, v)])),
  };
}

export type ScoreEvent = { age: number; type: string };
const MISTAKES = ['late_cancel', 'no_show', 'host_late_cancel', 'host_no_show'];

export function calcScore(events: ScoreEvent[], signInAges: number[] = [], r: ScoreRules = DEFAULT_RULES): number {
  const w = (e: ScoreEvent) => r.weights[e.type] ?? 0;
  const decay = (age: number) => Math.pow(0.5, age / r.halfLife);
  const good = events.filter((e) => w(e) > 0);
  let pos = 0; let neg = 0;
  for (const e of events) {
    const x = w(e);
    if (x > 0) { pos += x * decay(e.age); continue; }
    if (x === 0) continue;
    const inWindow = (o: ScoreEvent) => o.age > e.age && o.age <= e.age + r.graceWindow;
    let m = 1;
    if (e.type === 'early_cancel') m = 1 / (1 + good.filter(inWindow).length / r.cushion);
    else if (e.type === 'late_cancel' || e.type === 'no_show') {
      const g = events.some((o) => MISTAKES.includes(o.type) && inWindow(o)) ? 1 : r.graceFactor;
      m = g / (1 + good.filter(inWindow).length / r.cushion);
    }
    neg += -x * decay(e.age) * m;
  }
  const si = Math.min(r.signInCap, r.signInWeight * signInAges.reduce((s, a) => s + decay(a), 0));
  const s = (10 * (pos + si + (r.priorWeight * r.newMember) / 10)) / (pos + si + neg + r.priorWeight);
  return Math.round(Math.max(0, Math.min(10, s)) * 10) / 10;
}

const every = (from: number, to: number, step: number, type: string): ScoreEvent[] => { const o: ScoreEvent[] = []; for (let a = from; a <= to; a += step) o.push({ age: a, type }); return o; };

export type Example = { title: string; story: string; events: ScoreEvent[]; signIns?: number[] };

/** Stories shown on the "How reliability works" screen. Each is scored live by `calcScore`. */
export const EXAMPLES: Example[] = [
  { title: 'Just joined', story: 'Nothing has happened yet, so you start at the default.', events: [] },
  { title: 'A steady regular', story: 'Ten bookings and events over six months, no misses.', events: every(26, 170, 16, 'attended') },
  { title: 'A regular who misses one', story: 'The same ten, then one no-show. The first slip is forgiven most of the way, because the record behind it is long.', events: [...every(26, 170, 16, 'attended'), { age: 3, type: 'no_show' }] },
  { title: 'Came once, then missed one', story: 'One booking five months ago, then a no-show. There is little record to lean on, so it hurts more.', events: [{ age: 150, type: 'attended' }, { age: 3, type: 'no_show' }] },
  { title: 'A regular who misses two in a fortnight', story: 'Ten good ones, then two no-shows two weeks apart. The second slip does not get the first-time discount.', events: [...every(36, 170, 14, 'attended'), { age: 18, type: 'no_show' }, { age: 4, type: 'no_show' }] },
  { title: 'Recovers', story: 'Twenty good ones with one no-show three months back. Time and showing up heal it.', events: [...every(18, 170, 8, 'attended'), { age: 100, type: 'no_show' }] },
  { title: 'Opens the app every day for a month', story: 'Nothing else. Signing in adds a very little, and never more than one point in total.', events: [], signIns: Array.from({ length: 30 }, (_, i) => i) },
  { title: 'A host who does not show up', story: 'A regular with ten good ones, then does not turn up to a booking they host. This is the heaviest hit there is.', events: [...every(26, 170, 16, 'attended'), { age: 3, type: 'host_no_show' }] },
];
