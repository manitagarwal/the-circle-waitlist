export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export const INTERESTS_MIN = 3;
export const INTERESTS_MAX = 5;
export const MIN_AGE = 18;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** The four switches on the notifications screen and the backend categories each one controls. */
export const NOTIFICATION_SWITCHES = [
  { key: 'joins', label: 'Someone joins a booking you listed', categories: ['booking_join', 'booking_cancelled'] },
  { key: 'social', label: 'A friend request, first message or being added to a group', categories: ['friend_request', 'group_added'] },
  { key: 'reminder', label: 'A booking of yours starts in an hour', categories: ['booking_reminder'] },
  { key: 'news', label: 'Announcements from the team', categories: ['broadcast'] },
] as const;

/** DD, MM, YYYY text -> 'YYYY-MM-DD', or null if it is not a real past date. */
export function parseDob(d: string, m: string, y: string, today = new Date()): string | null {
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return null;
  const day = Number(d), month = Number(m), year = Number(y);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  if (year < 1900 || dt.getTime() > Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function ageOn(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

/** Add or remove an interest, never exceeding the maximum. */
export function toggleInterest(selected: number[], id: number, max = INTERESTS_MAX): number[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  return selected.length >= max ? selected : [...selected, id];
}

export type ProfileDraft = {
  avatarId: number | null; photoPath: string | null; interestIds: number[]; dob: string;
  gender: string; address: string; area: string; lat: number | null; lng: number | null; field: string;
};

/** Arguments for the complete_profile function. */
export function profileArgs(p: ProfileDraft) {
  return {
    p_avatar_id: p.photoPath ? null : p.avatarId, p_photo_path: p.photoPath, p_bio: null, p_dob: p.dob, p_gender: p.gender,
    p_address_text: p.address, p_lat: p.lat, p_lng: p.lng, p_area: p.area, p_field_of_work: p.field, p_interest_ids: p.interestIds,
  };
}
