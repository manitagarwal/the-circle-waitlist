// A soft colour for each activity group, so lists and covers have some life without getting loud.
// Light mode uses pastel tints behind ink; dark mode uses deep versions of the same colours.
export type Tone = { light: string; dark: string };

export const GROUPS: { name: string; tone: Tone; activities: string[] }[] = [
  { name: 'Sports', tone: { light: '#cfe4c8', dark: '#2e4a33' }, activities: ['Badminton', 'Cricket', 'Football/Futsal', 'Pickleball & Padel', 'Tennis & Squash', 'Basketball', 'Table Tennis', 'Volleyball'] },
  { name: 'Outdoors & travel', tone: { light: '#bfe6e1', dark: '#1f4f4b' }, activities: ['Treks & Hikes', 'Road Trips', 'Weekend Getaways'] },
  { name: 'Food, drinks & nightlife', tone: { light: '#f6d3b3', dark: '#5a3f26' }, activities: ['Cafe Hopping', 'Street Food Walks', 'Breakfast & Brunch', 'Lunch & Dinner', 'Cooking & Baking', 'Pub & Bar Nights', 'Clubbing'] },
  { name: 'Music & performance', tone: { light: '#d9ccf2', dark: '#3a3157' }, activities: ['Open Mic', 'Karaoke', 'Dance', 'Stand-up Comedy', 'Theatre & Shows', 'Concert & Gig'] },
  { name: 'Games & watch parties', tone: { light: '#c5dcf0', dark: '#28425a' }, activities: ['Board Games', 'Card Games', 'Chess', 'Video Gaming', 'Quizzing & Trivia', 'Escape Rooms', 'Match Watch Parties'] },
  { name: 'Career & tech', tone: { light: '#f2e6b8', dark: '#5a4f26' }, activities: ['Startups & Networking', 'Coding & Tech Meetups', 'Investing & Finance', 'Public Speaking & Debate', 'Design & Product'] },
  { name: 'Culture, learning & causes', tone: { light: '#ebcfe6', dark: '#55304f' }, activities: ['Photography', 'Art & Sketching', 'Film & Cinema Club', 'Podcasting & Content Creation', 'Museums & Galleries', 'Volunteering & Clean-up Drives', 'Pet Lovers', 'Language Learning', 'Writing & Poetry'] },
  { name: 'Clubs', tone: { light: '#e3d9c4', dark: '#4a4332' }, activities: ['Gym', 'Running', 'Cycling', 'Swimming', 'Yoga & Pilates', 'Meditation', 'Book Club'] },
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
