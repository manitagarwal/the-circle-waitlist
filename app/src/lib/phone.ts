/** Mobile numbers with a country code. The number is stored as "+<code><number>", for example +919876543210. */
export type Country = { name: string; dial: string; min: number; max: number };

// India first and the default. min/max are the lengths of the number without the country code.
export const COUNTRIES: Country[] = [
  { name: 'India', dial: '91', min: 10, max: 10 },
  { name: 'United States / Canada', dial: '1', min: 10, max: 10 },
  { name: 'United Kingdom', dial: '44', min: 10, max: 10 },
  { name: 'United Arab Emirates', dial: '971', min: 9, max: 9 },
  { name: 'Singapore', dial: '65', min: 8, max: 8 },
  { name: 'Australia', dial: '61', min: 9, max: 9 },
  { name: 'Canada / US toll-free', dial: '1', min: 10, max: 10 },
  { name: 'Germany', dial: '49', min: 10, max: 11 },
  { name: 'France', dial: '33', min: 9, max: 9 },
  { name: 'Netherlands', dial: '31', min: 9, max: 9 },
  { name: 'Switzerland', dial: '41', min: 9, max: 9 },
  { name: 'Italy', dial: '39', min: 9, max: 10 },
  { name: 'Spain', dial: '34', min: 9, max: 9 },
  { name: 'Saudi Arabia', dial: '966', min: 9, max: 9 },
  { name: 'Qatar', dial: '974', min: 8, max: 8 },
  { name: 'Kuwait', dial: '965', min: 8, max: 8 },
  { name: 'Oman', dial: '968', min: 8, max: 8 },
  { name: 'Bahrain', dial: '973', min: 8, max: 8 },
  { name: 'Nepal', dial: '977', min: 10, max: 10 },
  { name: 'Bangladesh', dial: '880', min: 10, max: 10 },
  { name: 'Sri Lanka', dial: '94', min: 9, max: 9 },
  { name: 'Malaysia', dial: '60', min: 9, max: 10 },
  { name: 'Hong Kong', dial: '852', min: 8, max: 8 },
  { name: 'New Zealand', dial: '64', min: 8, max: 10 },
  { name: 'Japan', dial: '81', min: 10, max: 10 },
];
// the picker needs one row per country code, so drop the duplicate +1 entry
export const PICKER: Country[] = COUNTRIES.filter((c) => c.name !== 'Canada / US toll-free');
export const DEFAULT_DIAL = '91';

const find = (dial: string) => COUNTRIES.find((c) => c.dial === dial);
export const maxLength = (dial: string) => {
  const rows = COUNTRIES.filter((c) => c.dial === dial);
  return rows.length ? Math.max(...rows.map((c) => c.max)) : 15;
};
const digits = (v: string) => v.replace(/\D/g, '');

/**
 * Turns whatever was typed or pasted into a country code and a national number (digits only).
 * "+91 98765 43210" typed into the number box moves the code to the code picker.
 */
export function readInput(dial: string, raw: string): { dial: string; national: string; resolved: boolean } {
  const t = raw.trim();
  if (t.startsWith('+') || t.startsWith('00')) {
    const all = digits(t.startsWith('00') ? t.slice(2) : t);
    // longest known code first, so +971 is not read as +9
    const hit = [...new Set(COUNTRIES.map((c) => c.dial))].sort((a, b) => b.length - a.length).find((d) => all.startsWith(d));
    if (hit) return { dial: hit, national: all.slice(hit.length).slice(0, maxLength(hit)), resolved: true };
    // still typing the code ("+9", "+97"): the caller keeps the text as it is until it resolves
    return { dial, national: all.slice(0, maxLength(dial)), resolved: false };
  }
  let n = digits(t);
  if (dial === '91' && n.length === 12 && n.startsWith('91')) n = n.slice(2);
  return { dial, national: n.slice(0, maxLength(dial)), resolved: true };
}

/** The stored form (+<code><number>), or null when the number is not valid for that country. */
export function validatePhone(dial: string, national: string): string | null {
  let n = digits(national);
  if (dial === '91') return /^[6-9]\d{9}$/.test(n.replace(/^0(?=\d{10}$)/, '')) ? `+91${n.replace(/^0(?=\d{10}$)/, '')}` : null;
  n = n.replace(/^0+/, ''); // a leading 0 is a local dialling prefix, not part of the number
  const rows = COUNTRIES.filter((c) => c.dial === dial);
  if (!rows.length || !rows.some((c) => n.length >= c.min && n.length <= c.max)) return null;
  return `+${dial}${n}`;
}

export function phoneError(dial: string, national: string): string | null {
  if (validatePhone(dial, national)) return null;
  if (dial === '91') return 'Enter a 10-digit Indian mobile number.';
  const c = find(dial);
  const len = c ? (c.min === c.max ? `${c.min}-digit` : `${c.min} to ${c.max}-digit`) : '';
  return `Enter a valid ${len} mobile number for ${c?.name ?? 'that country'}.`.replace('  ', ' ');
}

/** "+91 98765 43210" for display. Old records saved as ten bare digits are shown as Indian numbers. */
export function formatPhone(stored: string): string {
  const s = stored.trim();
  if (/^\d{10}$/.test(s)) return `+91 ${s.slice(0, 5)} ${s.slice(5)}`;
  const m = s.match(/^\+(\d+)$/);
  if (!m) return s;
  const all = m[1];
  const dial = [...new Set(COUNTRIES.map((c) => c.dial))].sort((a, b) => b.length - a.length).find((d) => all.startsWith(d));
  if (!dial) return s;
  const n = all.slice(dial.length);
  return `+${dial} ${n.length === 10 ? `${n.slice(0, 5)} ${n.slice(5)}` : n}`;
}
