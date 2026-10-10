import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_ICON_NAMES, activityIcon } from './activityIcons.ts';

// every activity that exists in the database has its own illustration
import { GROUPS } from './tones.ts';

// every activity that exists in the database has its own illustration
const ACTIVITIES = GROUPS.flatMap((g) => g.activities);

test('all 52 activities have a clipart', () => {
  assert.equal(ACTIVITIES.length, 52);
  assert.equal(ACTIVITY_ICON_NAMES.length, 52);
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
