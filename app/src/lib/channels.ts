import type { ChannelRow } from './api';

export const tagValue = (c: Pick<ChannelRow, 'tags'>, type: string) => c.tags.find((t) => t.type === type)?.value ?? null;

/** Who a channel is for, by the values stored in the tag. */
export const GENDER_AUDIENCE: Record<string, string> = { male: 'Men', female: 'Women', non_binary: 'Non-binary members', prefer_not_to_say: 'Prefer not to say' };

export const CHANNEL_CITIES = ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad'] as const;

/** "25 to 35", "25 and over", "Up to 35" or null when there is no limit. */
export function ageText(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min} to ${max}`;
  return min != null ? `${min} and over` : `Up to ${max}`;
}

export function channelAge(c: Pick<ChannelRow, 'tags'>): { min: number | null; max: number | null } {
  const lo = tagValue(c, 'age_min'), hi = tagValue(c, 'age_max');
  return { min: lo ? Number(lo) : null, max: hi ? Number(hi) : null };
}

/** "128 members. Gurgaon, Sector 43. 25 to 35. Women." */
export function channelSummary(c: ChannelRow): string {
  const parts = [`${c.member_count} ${c.member_count === 1 ? 'member' : 'members'}`];
  const place = [tagValue(c, 'city'), tagValue(c, 'area')].filter(Boolean).join(', ') || tagValue(c, 'area');
  if (place) parts.push(place);
  const { min, max } = channelAge(c);
  parts.push(ageText(min, max) ?? tagValue(c, 'age_group') ?? 'All ages');
  const g = tagValue(c, 'gender');
  if (g && GENDER_AUDIENCE[g]) parts.push(GENDER_AUDIENCE[g]);
  return parts.join('. ') + '.';
}

export type Filters = { city?: string; area?: string; activity?: string; age?: string; gender?: string };
export const FIT_MY_AGE = 'Fits my age';

export function applyFilters(channels: ChannelRow[], f: Filters, myAge: number | null = null): ChannelRow[] {
  return channels.filter((c) => {
    if (f.activity && c.interest_name !== f.activity) return false;
    if (f.city && tagValue(c, 'city') !== f.city) return false;
    if (f.area && tagValue(c, 'area') !== f.area) return false;
    if (f.gender && GENDER_AUDIENCE[tagValue(c, 'gender') ?? ''] !== f.gender) return false;
    if (f.age === FIT_MY_AGE && myAge != null) {
      const { min, max } = channelAge(c);
      if ((min != null && myAge < min) || (max != null && myAge > max)) return false;
    }
    return true;
  });
}

/** Distinct values to offer for a filter, from the channels on screen. */
export function filterOptions(channels: ChannelRow[], key: keyof Filters): string[] {
  const vals = channels.map((c) => {
    if (key === 'activity') return c.interest_name;
    if (key === 'gender') return GENDER_AUDIENCE[tagValue(c, 'gender') ?? ''] ?? null;
    if (key === 'age') return null;
    return tagValue(c, key);
  }).filter((x): x is string => !!x);
  return [...new Set(vals)].sort();
}

/** Validates the age fields of the create form: returns an error message or null. */
export function ageError(min: string, max: string): string | null {
  const lo = min.trim() === '' ? null : Number(min), hi = max.trim() === '' ? null : Number(max);
  if ((lo != null && (!Number.isInteger(lo) || lo < 18 || lo > 99)) || (hi != null && (!Number.isInteger(hi) || hi < 18 || hi > 99))) return 'Ages are between 18 and 99.';
  if (lo != null && hi != null && hi < lo) return 'The oldest age has to be at least the youngest.';
  return null;
}
