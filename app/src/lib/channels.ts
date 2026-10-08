import type { ChannelRow } from './api';

export const tagValue = (c: Pick<ChannelRow, 'tags'>, type: string) => c.tags.find((t) => t.type === type)?.value ?? null;

/** "128 members. Gurgaon. 25 to 35." */
export function channelSummary(c: ChannelRow): string {
  const parts = [`${c.member_count} ${c.member_count === 1 ? 'member' : 'members'}`];
  const area = tagValue(c, 'area'); if (area) parts.push(area);
  const age = tagValue(c, 'age_group'); parts.push(age ?? 'All ages');
  const g = tagValue(c, 'gender'); if (g && g !== 'Any') parts.push(g);
  return parts.join('. ') + '.';
}

export type Filters = { activity?: string; area?: string; age_group?: string; gender?: string };

export function applyFilters(channels: ChannelRow[], f: Filters): ChannelRow[] {
  return channels.filter((c) =>
    (!f.activity || c.interest_name === f.activity) &&
    (!f.area || tagValue(c, 'area') === f.area) &&
    (!f.age_group || tagValue(c, 'age_group') === f.age_group) &&
    (!f.gender || tagValue(c, 'gender') === f.gender));
}

/** Distinct values to offer for a filter, from the channels on screen. */
export function filterOptions(channels: ChannelRow[], key: keyof Filters): string[] {
  const vals = channels.map((c) => (key === 'activity' ? c.interest_name : tagValue(c, key))).filter((x): x is string => !!x);
  return [...new Set(vals)].sort();
}

export function groupByActivity(channels: ChannelRow[]): { activity: string; channels: ChannelRow[] }[] {
  const m = new Map<string, ChannelRow[]>();
  for (const c of channels) m.set(c.interest_name ?? 'Other', [...(m.get(c.interest_name ?? 'Other') ?? []), c]);
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([activity, list]) => ({ activity, channels: list.sort((a, b) => b.member_count - a.member_count) }));
}

export const AGE_GROUPS = ['Any age', '18 to 25', '25 to 35', '35 to 45', '45 and over'] as const;
export const GENDER_TAGS = ['Any', 'Men', 'Women'] as const;
