// One small illustration per activity: bold ink outlines with a neutral stone tint, no colour.
const Y = 'currentColor" fill-opacity=".14';
const K = 'currentColor';
const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ICONS: Record<string, string> = {
  // sports
  'Badminton': svg(`<circle cx="24" cy="38" r="5" fill="${Y}"/><path d="M19.5 34.5L13 12M28.5 34.5L35 12M24 33V10M13 12h22"/>`),
  'Tennis & Squash': svg(`<circle cx="24" cy="24" r="15" fill="${Y}"/><path d="M11 17c8 4 8 10 0 14M37 17c-8 4-8 10 0 14"/>`),
  'Table Tennis': svg(`<circle cx="21" cy="20" r="11" fill="${Y}"/><path d="M29 28l10 10"/><circle cx="38" cy="12" r="3"/>`),
  'Football/Futsal': svg(`<circle cx="24" cy="24" r="16"/><path d="M24 16l7 5-3 8h-8l-3-8z" fill="${Y}"/><path d="M24 16V8M31 21l7-3M28 29l4 7M20 29l-4 7M17 21l-7-3"/>`),
  'Basketball': svg(`<circle cx="24" cy="24" r="16" fill="${Y}"/><path d="M8 24h32M24 8v32M12 12c6 6 6 18 0 24M36 12c-6 6-6 18 0 24"/>`),
  'Cricket': svg(`<path d="M9 38l16-16 6 6-16 16z" fill="${Y}"/><path d="M25 22l9-9 4 4-9 9M7 41l2-3"/><circle cx="37" cy="37" r="3.5"/>`),
  'Volleyball': svg(`<circle cx="24" cy="24" r="16" fill="${Y}"/><path d="M24 8c-3 9 0 15 9 21M9 18c8-1 14 3 17 11M39 21c-6 2-10 6-12 13"/>`),
  'Swimming': svg(`<circle cx="31" cy="13" r="4" fill="${Y}"/><path d="M14 25l11-6 6 4M6 32c4-4 8 4 12 0s8 4 12 0 6 3 10 0M6 40c4-4 8 4 12 0s8 4 12 0 6 3 10 0"/>`),
  'Cycling': svg(`<circle cx="12" cy="31" r="7"/><circle cx="36" cy="31" r="7"/><path d="M12 31l7-14h10l7 14M19 17l7 14M27 12h5M19 17h-4"/><circle cx="26" cy="31" r="2.5" fill="${Y}"/>`),
  'Running': svg(`<circle cx="29" cy="9" r="4" fill="${Y}"/><path d="M26 16l-5 8 6 5-2 11M21 24l-9 3M26 16l8 6 6 1M27 29l9 4"/>`),
  'Yoga & Pilates': svg(`<circle cx="24" cy="9" r="4" fill="${Y}"/><path d="M24 15v12M24 19l-10 7M24 19l10 7M9 37c5-7 11-7 15-4 4-3 10-3 15 4-7 4-23 4-30 0z"/>`),
  'Gym': svg(`<path d="M6 21v6M42 21v6M12 24h24"/><rect x="11" y="15" width="5" height="18" rx="1.5" fill="${Y}"/><rect x="32" y="15" width="5" height="18" rx="1.5" fill="${Y}"/>`),
  // music and performing
  'Karaoke': svg(`<rect x="9" y="7" width="10" height="17" rx="5" fill="${Y}"/><path d="M7 21c0 6 4 9 7 9s7-3 7-9M14 30v9M29 35V15l11-3v20"/><circle cx="25" cy="36" r="4"/><circle cx="36" cy="32" r="4"/>`),
  'Dance': svg(`<circle cx="24" cy="9" r="4" fill="${Y}"/><path d="M24 14v13M24 18l-10-8M24 18l10-8M24 27l-8 14M24 27l9 6 3 7"/>`),
  'Theatre & Shows': svg(`<path d="M7 9h20v13c0 7-4 12-10 12S7 29 7 22z" fill="${Y}"/><path d="M12 17v2M22 17v2M12 25c3 3 7 3 10 0M27 17h14v12c0 6-3 10-7 10"/>`),
  'Open Mic': svg(`<circle cx="24" cy="12" r="6" fill="${Y}"/><path d="M20 8l8 8M24 18v20M14 42h20"/>`),
  'Clubbing': svg(`<circle cx="24" cy="27" r="14" fill="${Y}"/><path d="M24 5v8M10 27h28M24 13v28M14 18c6 4 14 4 20 0M14 36c6-4 14-4 20 0"/>`),
  'Pub & Bar Nights': svg(`<path d="M8 10h32L24 28z" fill="${Y}"/><path d="M24 28v12M16 40h16M30 10l6-6"/>`),
  'Cafe Hopping': svg(`<path d="M9 19h25v9c0 6-4 10-12 10S9 34 9 28z" fill="${Y}"/><path d="M34 22h3a4 4 0 010 8h-4M15 6c-2 3 2 4 0 7M22 6c-2 3 2 4 0 7M29 6c-2 3 2 4 0 7M7 42h30"/>`),
  // games
  'Board Games': svg(`<rect x="7" y="7" width="24" height="24" rx="5" fill="${Y}"/><path d="M14 14h.1M19 19h.1M24 24h.1"/><rect x="26" y="23" width="16" height="16" rx="4"/><path d="M31 28h.1M37 34h.1"/>`),
  'Card Games': svg(`<rect x="9" y="8" width="20" height="28" rx="3" transform="rotate(-12 19 22)"/><rect x="18" y="11" width="20" height="28" rx="3" fill="${Y}" transform="rotate(10 28 25)"/><path d="M28 19l5 7-5 7-5-7z"/>`),
  'Quizzing & Trivia': svg(`<path d="M24 5a12 12 0 00-7 22c1 1 2 3 2 5h10c0-2 1-4 2-5A12 12 0 0024 5z" fill="${Y}"/><path d="M19 37h10M21 42h6"/>`),
  'Chess': svg(`<circle cx="24" cy="12" r="6" fill="${Y}"/><path d="M20 18c0 6-4 8-4 14h16c0-6-4-8-4-14M13 41h22M15 32h18v5H15z"/>`),
  'Escape Rooms': svg(`<circle cx="16" cy="16" r="9" fill="${Y}"/><circle cx="16" cy="16" r="2.5"/><path d="M23 23l16 16M32 32l4-4M36 36l4-4"/>`),
  'Video Gaming': svg(`<path d="M12 14h24c4 0 6 3 7 8l2 12c0 4-5 5-8 2l-5-6H16l-5 6c-3 3-8 2-8-2l2-12c1-5 3-8 7-8z" fill="${Y}"/><path d="M14 21v7M10.5 24.5h7"/><path d="M31 22h.1M36 26h.1"/>`),
  // learning and ideas
  'Book Club': svg(`<path d="M24 12c-5-3-12-3-16-2v26c4-1 11-1 16 2 5-3 12-3 16-2V10c-4-1-11-1-16 2z" fill="${Y}"/><path d="M24 12v26"/>`),
  'Writing & Poetry': svg(`<path d="M8 40l3-11L33 7l8 8-22 22z" fill="${Y}"/><path d="M28 12l8 8M11 29l8 8"/>`),
  'Podcasting & Content Creation': svg(`<path d="M8 28v-4a16 16 0 0132 0v4"/><rect x="6" y="26" width="9" height="14" rx="3" fill="${Y}"/><rect x="33" y="26" width="9" height="14" rx="3" fill="${Y}"/>`),
  'Investing & Finance': svg(`<path d="M6 41h36"/><rect x="10" y="29" width="6" height="12" fill="${Y}"/><rect x="21" y="22" width="6" height="19" fill="${Y}"/><rect x="32" y="14" width="6" height="27" fill="${Y}"/><path d="M10 20l9-8 7 5 12-10M32 7h6v6"/>`),
  'Public Speaking & Debate': svg(`<path d="M13 22h22l-3 18H16z" fill="${Y}"/><path d="M8 6h15v10h-8l-4 4v-4H8zM28 12h12v8h-3v4l-5-4h-4z"/>`),
  'Language Learning': svg(`<path d="M6 7h24v17H18l-8 6v-6H6z" fill="${Y}"/><path d="M13 20l5-10 5 10M14.5 16h7"/><path d="M28 29h14v12h-3v4l-5-4H28z"/>`),
  'Coding & Tech Meetups': svg(`<rect x="5" y="9" width="38" height="28" rx="4" fill="${Y}"/><path d="M17 19l-6 5 6 5M31 19l6 5-6 5M26 16l-4 16M16 42h16"/>`),
  'Meditation': svg(`<path d="M24 38c-9 0-15-5-17-14 6 0 10 3 13 8 1-9 3-16 4-22 1 6 3 13 4 22 3-5 7-8 13-8-2 9-8 14-17 14z" fill="${Y}"/>`),
  // culture and going out
  'Film & Cinema Club': svg(`<rect x="6" y="19" width="36" height="21" rx="3" fill="${Y}"/><path d="M6 19l3-9 32-4 2 9M14 15l5 4M24 13l5 4M34 11l5 4"/>`),
  'Photography': svg(`<rect x="6" y="14" width="36" height="25" rx="5" fill="${Y}"/><circle cx="24" cy="27" r="7" fill="currentColor" fill-opacity=".04"/><circle cx="24" cy="27" r="2.5"/><path d="M16 14l3-6h10l3 6"/>`),
  'Weekend Getaways': svg(`<rect x="8" y="16" width="32" height="24" rx="4" fill="${Y}"/><path d="M18 16v-5a2 2 0 012-2h8a2 2 0 012 2v5M8 26h32M20 26v4h8v-4"/>`),
  'Pet Lovers': svg(`<ellipse cx="24" cy="31" rx="9" ry="7" fill="${Y}"/><circle cx="12" cy="22" r="4"/><circle cx="19" cy="13" r="4"/><circle cx="29" cy="13" r="4"/><circle cx="36" cy="22" r="4"/>`),
  'Volunteering & Clean-up Drives': svg(`<path d="M24 41C8 29 8 17 16 12c4-2 7 0 8 3 1-3 4-5 8-3 8 5 8 17-8 29z" fill="${Y}"/>`),

  // added
  'Pickleball & Padel': svg(`<rect x="10" y="5" width="22" height="26" rx="9" fill="${Y}"/><path d="M21 31v11M17 42h8"/><circle cx="37" cy="35" r="6"/><path d="M35 33h.01M39 34h.01M36 38h.01"/>`),
  'Treks & Hikes': svg(`<path d="M4 41l14-24 8 13 5-8 13 19z" fill="${Y}"/><path d="M18 17l-2-9M16 8h9l-3 3 3 3h-9"/>`),
  'Road Trips': svg(`<path d="M5 31l3-9a4 4 0 0 1 4-3h24a4 4 0 0 1 4 3l3 9v8H5z" fill="${Y}"/><circle cx="14" cy="38" r="4" fill="${K}"/><circle cx="34" cy="38" r="4" fill="${K}"/><path d="M10 25h28"/>`),
  'Street Food Walks': svg(`<path d="M6 42L41 7"/><circle cx="16" cy="32" r="5.5" fill="${Y}"/><circle cx="24" cy="24" r="5.5"/><circle cx="32" cy="16" r="5.5" fill="${Y}"/>`),
  'Breakfast & Brunch': svg(`<path d="M7 20h24v10a10 10 0 0 1-10 10h-4A10 10 0 0 1 7 30z" fill="${Y}"/><path d="M31 23h4a4 4 0 0 1 0 8h-4M13 8v6M19 6v8M25 8v6"/>`),
  'Lunch & Dinner': svg(`<circle cx="25" cy="25" r="12" fill="${Y}"/><path d="M6 7v12M10 7v12M6 13h4M8 19v21M43 7c-4 3-4 11 0 15v18"/>`),
  'Cooking & Baking': svg(`<path d="M12 28a8 8 0 1 1 4-15 8 8 0 0 1 16 0 8 8 0 1 1 4 15z" fill="${Y}"/><path d="M14 28v12h20V28"/>`),
  'Stand-up Comedy': svg(`<circle cx="24" cy="24" r="17" fill="${Y}"/><path d="M16 21h.01M32 21h.01M14 28c3 9 17 9 20 0z"/>`),
  'Concert & Gig': svg(`<path d="M18 36V11l19-4v24"/><circle cx="13" cy="36" r="5.5" fill="${Y}"/><circle cx="32" cy="32" r="5.5" fill="${Y}"/>`),
  'Match Watch Parties': svg(`<rect x="5" y="9" width="38" height="26" rx="4" fill="${Y}"/><path d="M16 42h16M24 35v7"/><circle cx="24" cy="22" r="6"/>`),
  'Startups & Networking': svg(`<path d="M24 5c8 4 12 12 10 22l-6 6H20l-6-6C12 17 16 9 24 5z" fill="${Y}"/><circle cx="24" cy="18" r="3.5"/><path d="M14 28l-7 6 9-2M34 28l7 6-9-2M24 37v6"/>`),
  'Design & Product': svg(`<path d="M8 40l4-12L32 8l8 8-20 20z" fill="${Y}"/><path d="M28 12l8 8M12 28l8 8"/>`),
  'Art & Sketching': svg(`<path d="M24 6C13 6 6 14 6 24s8 18 18 18c3 0 4-2 4-4s-2-3-2-5 2-4 5-4h6c5 0 7-3 7-7 0-9-9-16-22-16z" fill="${Y}"/><circle cx="16" cy="23" r="2.5" fill="${K}"/><circle cx="24" cy="15" r="2.5" fill="${K}"/><circle cx="33" cy="20" r="2.5" fill="${K}"/>`),
  'Museums & Galleries': svg(`<path d="M4 18L24 6l20 12z" fill="${Y}"/><path d="M10 22v14M20 22v14M28 22v14M38 22v14M5 41h38"/>`),
};

/** The illustration for an activity (by its name), or null when there is none. */
export const activityIcon = (name?: string | null): string | null => (name ? ICONS[name] ?? null : null);
export const ACTIVITY_ICON_NAMES = Object.keys(ICONS);
