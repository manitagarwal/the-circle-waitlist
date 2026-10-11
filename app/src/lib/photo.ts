import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MAX_PHOTO_BYTES } from './profile';

/** Lets the person choose a square photo, shrinks it to 1080 px JPEG. Returns null if they cancel; throws a readable message if it fails. */
export async function pickPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const out = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 1080 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  const size = (await (await fetch(out.uri)).arrayBuffer()).byteLength;
  if (size > MAX_PHOTO_BYTES) throw new Error('That photo is over 5 MB. Try another.');
  return out.uri;
}

/** Picks a wide photo for a booking (16:10), shrinks it to 1440 px JPEG and returns its local link and bytes. */
export async function pickBookingPhoto(): Promise<{ uri: string; bytes: ArrayBuffer } | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 10], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const out = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 1440 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  const bytes = await (await fetch(out.uri)).arrayBuffer();
  if (bytes.byteLength > MAX_PHOTO_BYTES) throw new Error('That photo is over 5 MB. Try another.');
  return { uri: out.uri, bytes };
}
