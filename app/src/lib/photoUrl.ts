import { SUPABASE_URL } from './config.ts';

/** The public link to a picture in our photo library (bucket `activity-photos`). */
export const libraryPhotoUrl = (path: string | null | undefined): string | null =>
  path ? `${SUPABASE_URL}/storage/v1/object/public/activity-photos/${path.split('/').map(encodeURIComponent).join('/')}` : null;
