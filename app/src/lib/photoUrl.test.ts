import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryPhotoUrl } from './photoUrl.ts';

test('no path means no link', () => assert.equal(libraryPhotoUrl(null), null));
test('builds a public link and escapes each part', () => {
  const u = libraryPhotoUrl('padel/court one.jpg')!;
  assert.match(u, /\/storage\/v1\/object\/public\/activity-photos\/padel\/court%20one\.jpg$/);
});
