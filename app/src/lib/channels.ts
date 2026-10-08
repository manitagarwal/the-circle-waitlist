import type { ChannelRow } from './api';

export const tagValues = (c: Pick<ChannelRow, 'tags'>, type: string) => c.tags.filter((t) => t.type === type).map((t) => t.value);
export const tagValue = (c: Pick<ChannelRow, 'tags'>, type: string) => tagValues(c, type)[0] ?? null;

/** Who a channel is for, by the values stored in the gender tag. */
export const GENDER_AUDIENCE: Record<string, string> = { male: 'Men', female: 'Women', non_binary: 'Non-binary members', prefer_not_to_say: 'Prefer not to say' };

export const CHANNEL_CITIES = ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad'] as const;

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);

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

/** "128 members. Gurgaon, Noida. Sector 43. 25 to 35. Women." No city means Pan India. */
export function channelSummary(c: ChannelRow): string {
  const parts = [`${c.member_count} ${c.member_count === 1 ? 'member' : 'members'}`];
  const cities = tagValues(c, 'city');
  parts.push(cities.length ? cities.join(', ') : 'Pan India');
  const area = tagValue(c, 'area'); if (area) parts.push(area);
  const { min, max } = channelAge(c);
  parts.push(ageText(min, max) ?? tagValue(c, 'age_group') ?? 'All ages');
  const g = tagValues(c, 'gender').map((x) => GENDER_AUDIENCE[x]).filter(Boolean);
  if (g.length) parts.push(g.join(', '));
  return parts.join('. ') + '.';
}

export type Me = { age: number | null; gender: string | null; city: string | null };

/** Why this member cannot join (null = they fit). The server decides; this only lets us say so before they tap. */
export function channelFit(c: ChannelRow, me: Me): string | null {
  const cities = tagValues(c, 'city');
  if (cities.length && me.city && !cities.some((x) => x.toLowerCase() === me.city!.toLowerCase())) return `For members in ${list(cities)}.`;
  const genders = tagValues(c, 'gender');
  if (genders.length && me.gender && !genders.includes(me.gender)) return `For ${list(genders.map((g) => (GENDER_AUDIENCE[g] ?? g).toLowerCase()))}.`;
  const { min, max } = channelAge(c);
  if (me.age != null && ((min != null && me.age < min) || (max != null && me.age > max))) return `For ages ${ageText(min, max)}.`;
  return null;
}

export type Filters = { city?: string; area?: string; activity?: string; gender?: string; fit?: string };
export const FITS_ME = 'Only ones I can join';

export function applyFilters(channels: ChannelRow[], f: Filters, me: Me | null = null): ChannelRow[] {
  return channels.filter((c) => {
    if (f.activity && c.interest_name !== f.activity) return false;
    if (f.city && !tagValues(c, 'city').includes(f.city)) return false;
    if (f.area && tagValue(c, 'area') !== f.area) return false;
    if (f.gender && !tagValues(c, 'gender').some((g) => GENDER_AUDIENCE[g] === f.gender)) return false;
    if (f.fit === FITS_ME && me && channelFit(c, me)) return false;
    return true;
  });
}

/** Distinct values to offer for a filter, from the channels on screen. */
export function filterOptions(channels: ChannelRow[], key: keyof Filters): string[] {
  const vals = channels.flatMap((c) => {
    if (key === 'activity') return c.interest_name ? [c.interest_name] : [];
    if (key === 'gender') return tagValues(c, 'gender').map((g) => GENDER_AUDIENCE[g]).filter(Boolean);
    if (key === 'fit') return [];
    return tagValues(c, key);
  });
  return [...new Set(vals)].sort();
}

/** Validates the age fields of the create form: returns an error message or null. */
export function ageError(min: string, max: string): string | null {
  const lo = min.trim() === '' ? null : Number(min), hi = max.trim() === '' ? null : Number(max);
  if ((lo != null && (!Number.isInteger(lo) || lo < 18 || lo > 99)) || (hi != null && (!Number.isInteger(hi) || hi < 18 || hi > 99))) return 'Ages are between 18 and 99.';
  if (lo != null && hi != null && hi < lo) return 'The oldest age has to be at least the youngest.';
  return null;
}
