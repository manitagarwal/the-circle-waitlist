export const PERSONAL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com', 'hotmail.com',
  'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'rediffmail.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'zoho.com',
];

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const normalizeEmail = (v: string) => v.trim().toLowerCase();
export const isPersonalEmail = (v: string) =>
  PERSONAL_DOMAINS.includes(normalizeEmail(v).split('@')[1] ?? '');

/** Returns the 10-digit national number, or null when it is not a valid Indian mobile. */
export function normalizePhone(v: string): string | null {
  let d = v.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export const isLinkedIn = (v: string) => /linkedin\.com\/.+/i.test(v.trim());
export const linkedInHandle = (v: string) => v.match(/linkedin\.com\/in\/([^/?\s]+)/i)?.[1] ?? null;

export const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const cleanInviteCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isInviteCode = (v: string) =>
  cleanInviteCode(v).length === 10 && [...cleanInviteCode(v)].every((c) => INVITE_ALPHABET.includes(c));

export function usernameProblem(v: string): string | null {
  if (v.length < 3 || v.length > 20) return 'Use 3 to 20 characters.';
  if (!/^[a-z0-9][a-z0-9._]*[a-z0-9]$/.test(v)) return 'Lowercase letters, numbers, dot and underscore. Start and end with a letter or number.';
  if (/[._]{2}/.test(v)) return 'No two dots or underscores in a row.';
  return null;
}
export const cleanUsername = (v: string) => v.toLowerCase().replace(/[^a-z0-9._]/g, '');

export const isOtp = (v: string) => /^\d{6}$/.test(v);
export const applicationCode = (v: string) => v.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8);
export const isApplicationCode = (v: string) => /^[A-F0-9]{8}$/.test(applicationCode(v));

export function passwordChecks(p: string) {
  return { length: p.length >= 8, mixed: /[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p) };
}
