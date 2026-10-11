/** "in 2h 14m", "in 3 days", "Starting now", "Happening now". Ticks as `now` moves. */
export function countdown(startsAt: string, endsAt: string, now = Date.now()): { text: string; soon: boolean; live: boolean } {
  const s = new Date(startsAt).getTime(), e = new Date(endsAt).getTime();
  if (now >= e) return { text: 'Over', soon: false, live: false };
  if (now >= s) return { text: 'Happening now', soon: true, live: true };
  const mins = Math.ceil((s - now) / 60000);
  if (mins <= 1) return { text: 'Starting now', soon: true, live: false };
  if (mins < 60) return { text: `in ${mins} min`, soon: true, live: false };
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h < 24) return { text: m ? `in ${h}h ${m}m` : `in ${h}h`, soon: h < 3, live: false };
  const d = Math.floor(h / 24);
  return { text: d === 1 ? 'tomorrow' : `in ${d} days`, soon: false, live: false };
}
