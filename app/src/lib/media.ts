import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const cache = new Map<string, { url: string; at: number }>();
const TTL = 50 * 60 * 1000; // signed for an hour, reused for 50 minutes

/** A temporary link to a private profile photo, or null while loading / when there is none. */
export function useSignedUrl(path: string | null | undefined, bucket = 'profile-photos'): string | null {
  const key = path ? `${bucket}/${path}` : '';
  const hit = key ? cache.get(key) : undefined;
  const [url, setUrl] = useState<string | null>(hit && Date.now() - hit.at < TTL ? hit.url : null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    const c = cache.get(key);
    if (c && Date.now() - c.at < TTL) { setUrl(c.url); return; }
    let live = true;
    supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
      if (!live || !data?.signedUrl) return;
      cache.set(key, { url: data.signedUrl, at: Date.now() });
      setUrl(data.signedUrl);
    });
    return () => { live = false; };
  }, [path, bucket, key]);
  return url;
}
