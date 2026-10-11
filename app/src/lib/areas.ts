type A = { id: number; name: string; place: string | null; sort: number };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\bsec(tor)?\b/g, 'sector').replace(/\s+/g, ' ').trim();

/** Areas that match what was typed: every word must appear, whole-name matches and name starts first. "sec 56" finds "Sector 56, Gurugram". */
export function matchAreas<T extends A>(areas: T[], q: string, limit = 40): T[] {
  const t = norm(q);
  if (!t) return areas.slice(0, limit);
  const words = t.split(' ');
  const scored: [number, T][] = [];
  for (const a of areas) {
    const n = norm(a.name);
    if (!words.every((w) => n.includes(w))) continue;
    // A bare number must match a whole number ("5" should not pull in "56").
    if (words.some((w) => /^\d+$/.test(w) && !n.split(' ').includes(w))) continue;
    scored.push([n.startsWith(t) ? 0 : n.includes(` ${t}`) ? 1 : 2, a]);
  }
  return scored.sort((x, y) => x[0] - y[0] || x[1].sort - y[1].sort || x[1].name.localeCompare(y[1].name, 'en', { numeric: true })).slice(0, limit).map((x) => x[1]);
}
