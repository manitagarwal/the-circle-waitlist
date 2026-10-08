import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Avatar } from '@/components/Avatar';
import { State } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { AVATAR_IDS } from '@/lib/avatars';
import { api, useAuth } from '@/lib/auth';
import { useSignedUrl } from '@/lib/media';
import { friendly, usernameStatusText } from '@/lib/messages';
import { pickPhoto } from '@/lib/photo';
import { cleanUsername, usernameProblem } from '@/lib/validators';

export default function EditProfile() {
  const r = useRouter();
  const { member, refresh } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [area, setArea] = useState('');
  const [field, setField] = useState('');
  const [name, setName] = useState(member?.username ?? '');
  const [avail, setAvail] = useState<'idle' | 'checking' | 'local' | string>('idle');
  const [busy, setBusy] = useState<'' | 'photo' | 'save'>('');
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const url = useSignedUrl(photoPath);

  useEffect(() => {
    api.ownRow().then(({ row }) => { setPhotoPath(row.photo_path); setAvatarId(row.avatar_id); setBio(row.bio ?? ''); setArea(row.area); setField(row.field_of_work); setLoaded(true); }).catch((e) => setErr(friendly(e)));
  }, []);

  const changed = name !== member?.username;
  useEffect(() => {
    if (!changed) return setAvail('idle');
    if (usernameProblem(name)) return setAvail('local');
    setAvail('checking');
    let live = true;
    const t = setTimeout(() => { api.usernameAvailable(name).then((s) => live && setAvail(s)).catch(() => live && setAvail('idle')); }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [name, changed]);
  const nameErr = avail === 'local' ? usernameProblem(name) : !['ok', 'idle', 'checking'].includes(avail) ? usernameStatusText(avail) : null;

  const changePhoto = async () => {
    setBusy('photo'); setErr(null);
    try {
      const uri = await pickPhoto();
      if (!uri || !member) return;
      const path = await api.uploadProfilePhoto(member.id, await (await fetch(uri)).arrayBuffer());
      await api.saveProfile({ photoPath: path });
      setPhotoPath(path);
    } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const pickAvatar = async (id: number) => {
    setBusy('photo'); setErr(null);
    try { await api.saveProfile({ avatarId: id, photoPath: null }); setAvatarId(id); setPhotoPath(null); } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const save = async () => {
    setBusy('save'); setErr(null); setSaved(false);
    try {
      await api.saveProfile({ bio: bio.trim() || null, area: area.trim(), field: field.trim() });
      if (changed && avail === 'ok') await api.setUsername(name);
      await refresh();
      setSaved(true);
    } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Photo, bio and username" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <State loading={!loaded && !err} />
        {loaded ? (<>
          <View style={{ alignItems: 'center' }}><Avatar uri={url} avatarId={avatarId} size={112} /></View>
          <Button label="Upload a photo" variant="secondary" onPress={changePhoto} loading={busy === 'photo'} style={{ marginTop: 14 }} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginTop: 20 }}>Or choose an avatar</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {AVATAR_IDS.map((id) => {
              const on = !photoPath && avatarId === id;
              return (
                <Pressable key={id} accessibilityRole="radio" accessibilityLabel={`Avatar ${id}`} accessibilityState={{ selected: on }} onPress={() => pickAvatar(id)}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? colors.goldText : 'transparent' }}><Avatar avatarId={id} size={56} /></Pressable>
              );
            })}
          </View>

          <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={300} style={{ height: 96, paddingTop: 12, textAlignVertical: 'top' }} hint={`${bio.length} of 300. Others see this on your profile.`} />
          <TextField label="Area others will see" value={area} onChangeText={setArea} />
          <TextField label="Field of work" value={field} onChangeText={setField} />
          <TextField label="Username" value={name} onChangeText={(v) => setName(cleanUsername(v).slice(0, 20))} autoCapitalize="none" autoCorrect={false} error={nameErr} ok={avail === 'ok'}
            hint={avail === 'ok' ? `${name} is available.` : 'Lowercase letters, numbers, dot and underscore. You can change it once every 30 days.'} />
          {err ? <Notice tone="error">{err}</Notice> : null}
          {saved ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.sage, marginTop: 12 }}>Saved.</Text> : null}
          <Button label="Save" onPress={save} loading={busy === 'save'} disabled={!area.trim() || !field.trim() || (changed && avail !== 'ok')} style={{ marginTop: 20 }} />
          <Body style={{ fontSize: 13, marginTop: 12 }}>Your name, work email and LinkedIn came with your application, so they can't be changed here.</Body>
        </>) : null}
        {!loaded && err ? <Notice tone="error">{err}</Notice> : null}
      </ScrollView>
    </View>
  );
}
