// A soft colour for each activity group, so lists and covers have some life without getting loud.
// Light mode uses pastel tints behind ink; dark mode uses deep versions of the same colours.
export type Tone = { light: string; dark: string };

export const GROUPS: { name: string; tone: Tone; activities: string[] }[] = [
  { name: 'Sports & fitness', tone: { light: '#cfe4c8', dark: '#2e4a33' }, activities: ['Badminton', 'Basketball', 'Bowling', 'Cricket', 'Cycling', 'Football', 'Golf', 'Gym', 'Pilates', 'Running', 'Squash', 'Swimming', 'Table Tennis', 'Tennis', 'Volleyball', 'Yoga'] },
  { name: 'Music & performance', tone: { light: '#d9ccf2', dark: '#3a3157' }, activities: ['Dance', 'Drums', 'Guitar', 'Karaoke', 'Piano', 'Singing', 'Stand-up/Open Mic', 'Theatre/Acting'] },
  { name: 'Nightlife & social games', tone: { light: '#f6d3b3', dark: '#5a3f26' }, activities: ['Bar Hopping', 'Board Games', 'Cafe Hopping', 'Clubbing', 'Escape Rooms', 'Poker', 'Trivia Nights'] },
  { name: 'Intellectual & hobby', tone: { light: '#c5dcf0', dark: '#28425a' }, activities: ['Chess', 'Coding/Tech Meetups', 'Investing/Stocks', 'Language Learning', 'Podcasting', 'Public Speaking/Debate', 'Quizzing', 'Reading/Book Club', 'Writing'] },
  { name: 'Wellness & mindfulness', tone: { light: '#f2e6b8', dark: '#5a4f26' }, activities: ['Journaling', 'Meditation', 'Running Clubs', 'Spa/Self-care'] },
  { name: 'Travel & culture', tone: { light: '#bfe6e1', dark: '#1f4f4b' }, activities: ['Film/Cinema Club', 'Travel Meetups', 'Weekend Getaways'] },
  { name: 'Others', tone: { light: '#ebcfe6', dark: '#55304f' }, activities: ['Pet Lovers', 'Photography', 'Video Gaming', 'Volunteering'] },
];

const byActivity = new Map<string, Tone>();
const byGroup = new Map<string, Tone>();
for (const g of GROUPS) { byGroup.set(g.name, g.tone); for (const a of g.activities) byActivity.set(a, g.tone); }

/** The colour for an activity or a group name, or null when it has none. */
export const toneFor = (name?: string | null, dark = false): string | null => {
  if (!name) return null;
  const t = byActivity.get(name) ?? byGroup.get(name);
  return t ? (dark ? t.dark : t.light) : null;
};
