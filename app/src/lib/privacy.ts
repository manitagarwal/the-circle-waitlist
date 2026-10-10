/** What a member can hide from other members. Their photo, name and username are always visible. */
export type PrivacyKey = 'hide_bio' | 'hide_age' | 'hide_area' | 'hide_work' | 'hide_interests' | 'hide_hosted' | 'hide_since';
export type Privacy = Partial<Record<PrivacyKey, boolean>>;

export const PRIVACY_FIELDS: { key: PrivacyKey; label: string; example: string }[] = [
  { key: 'hide_bio', label: 'Bio', example: 'The few lines about you' },
  { key: 'hide_age', label: 'Age', example: 'For example, 27' },
  { key: 'hide_area', label: 'Area', example: 'For example, Vasant Kunj' },
  { key: 'hide_work', label: 'Field of work', example: 'For example, Product design' },
  { key: 'hide_interests', label: 'Activities you are into', example: 'The colourful chips' },
  { key: 'hide_hosted', label: 'Bookings you have hosted', example: 'The count on your profile' },
  { key: 'hide_since', label: 'Member since', example: 'The month you joined' },
];

export const isShown = (p: Privacy | null | undefined, key: PrivacyKey) => !p?.[key];

/** The profile line under a name, from only what is shown, e.g. "27 · Vasant Kunj · Product design". */
export const aboutLine = (p: { age?: number | null; area?: string | null; field_of_work?: string | null }) => [p.age, p.area, p.field_of_work].filter((x) => x != null && x !== '').join(' · ');
