import type { Api } from './api.ts';

type Groups = Awaited<ReturnType<Api['interestGroups']>>;
let cache: Promise<Groups> | null = null;

/** The activity buckets and their activities, fetched once and reused everywhere. */
export function loadInterestGroups(fetcher: () => Promise<Groups>): Promise<Groups> {
  if (!cache) cache = fetcher().catch((e) => { cache = null; throw e; });
  return cache;
}

/** interest id -> { group id, group name, activity name }. */
export function interestIndex(groups: Groups) {
  const m = new Map<number, { groupId: number; group: string; name: string }>();
  for (const g of groups) for (const i of g.interests) m.set(i.id, { groupId: g.id, group: g.name, name: i.name });
  return m;
}

/** Items bucketed by activity group, in the groups' own order; groups with nothing are left out. */
export function bucket<T>(groups: Groups, items: T[], interestOf: (t: T) => number | null) {
  const idx = interestIndex(groups);
  return groups
    .map((g) => ({ group: g, items: items.filter((t) => { const id = interestOf(t); return id != null && idx.get(id)?.groupId === g.id; }) }))
    .filter((b) => b.items.length > 0);
}
