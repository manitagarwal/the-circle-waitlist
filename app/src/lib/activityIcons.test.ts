import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_ICON_NAMES, activityIcon } from './activityIcons.ts';

// every activity that exists in the database has its own illustration
const ACTIVITIES = ['Badminton', 'Bar Hopping', 'Basketball', 'Board Games', 'Bowling', 'Cafe Hopping', 'Chess', 'Clubbing', 'Coding/Tech Meetups', 'Cricket', 'Cycling', 'Dance', 'Drums', 'Escape Rooms',
  'Film/Cinema Club', 'Football', 'Golf', 'Guitar', 'Gym', 'Investing/Stocks', 'Journaling', 'Karaoke', 'Language Learning', 'Meditation', 'Pet Lovers', 'Photography', 'Piano', 'Pilates', 'Podcasting', 'Poker',
  'Public Speaking/Debate', 'Quizzing', 'Reading/Book Club', 'Running', 'Running Clubs', 'Singing', 'Spa/Self-care', 'Squash', 'Stand-up/Open Mic', 'Swimming', 'Table Tennis', 'Tennis', 'Theatre/Acting',
  'Travel Meetups', 'Trivia Nights', 'Video Gaming', 'Volleyball', 'Volunteering', 'Weekend Getaways', 'Writing', 'Yoga'];

test('all 51 activities have a clipart', () => {
  assert.equal(ACTIVITIES.length, 51);
  for (const a of ACTIVITIES) assert.ok(activityIcon(a), `missing: ${a}`);
  assert.equal(new Set(ACTIVITY_ICON_NAMES).size, ACTIVITY_ICON_NAMES.length);
});
test('each one is a valid, distinct drawing; unknown names get none', () => {
  const seen = new Set<string>();
  for (const a of ACTIVITIES) {
    const s = activityIcon(a)!;
    assert.match(s, /^<svg [^>]*viewBox="0 0 48 48"[^>]*>.*<\/svg>$/);
    assert.equal(seen.has(s), false, `duplicate drawing: ${a}`);
    seen.add(s);
  }
  assert.equal(activityIcon('Underwater Basket Weaving'), null);
  assert.equal(activityIcon(null), null);
});
