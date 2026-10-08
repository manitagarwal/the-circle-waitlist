export const GROUP_MAX_MEMBERS = 50; // the server enforces it; this is only for the counter

/** Friends who can still be added, filtered by what the person typed. */
export function addableFriends<T extends { id: string; username: string }>(friends: T[], inGroup: string[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return friends.filter((f) => !inGroup.includes(f.id) && (!q || f.username.toLowerCase().includes(q)));
}

/** How many more people fit, given who is already in and who is picked. */
export const spotsLeft = (alreadyIn: number, picked: number, max = GROUP_MAX_MEMBERS) => Math.max(0, max - alreadyIn - picked);
