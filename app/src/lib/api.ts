import type { SupabaseClient } from '@supabase/supabase-js';
import { applicationCode, normalizeEmail, normalizePhone } from './validators.ts';

export type Dupes = { phone?: boolean; personal_email?: boolean; work_email?: boolean };
export type ApplicationInput = {
  id: string; fullName: string; phone: string; personalEmail: string; workEmail: string;
  linkedin: string; city: string; referredByCode?: string;
};
export type Application = {
  id: string; full_name: string; status: string; city: string; created_at: string;
  queue_position: number | null; referral_code: string;
};
export type Vouch = { name?: string; email?: string; phone?: string };

/** Pure data layer. Takes the client so it can be tested with a fake. */
export function createApi(sb: SupabaseClient, sbWork: SupabaseClient = sb) {
  const rpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<T> => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    return data as T;
  };
  return {
    checkDuplicates: (p: { phone?: string; personalEmail?: string; workEmail?: string }) =>
      rpc<Dupes>('check_applicant_duplicates', {
        p_phone: p.phone ? normalizePhone(p.phone) : null,
        p_personal_email: p.personalEmail ? normalizeEmail(p.personalEmail) : null,
        p_work_email: p.workEmail ? normalizeEmail(p.workEmail) : null,
      }),
    sendCode: async (email: string, createUser: boolean) => {
      const { error } = await sb.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: createUser } });
      if (error) throw error;
    },
    verifyCode: async (email: string, token: string) => {
      const { error } = await sb.auth.verifyOtp({ email: normalizeEmail(email), token, type: 'email' });
      if (error) throw error;
    },
    /** Work email: proven with a code through a separate, throwaway client. */
    sendWorkCode: async (email: string) => {
      const { error } = await sbWork.auth.signInWithOtp({ email: normalizeEmail(email), options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    verifyWorkCode: async (email: string, token: string) => {
      const { error } = await sbWork.auth.verifyOtp({ email: normalizeEmail(email), token, type: 'email' });
      if (error) throw error;
      await sbWork.auth.signOut({ scope: 'local' }); // discard that session; only the proof matters
    },
    usernameAvailable: (u: string) => rpc<string>('username_available', { p_username: u }),
    activate: (username: string) => rpc<{ member_id: string; username: string }>('activate_membership', { p_username: username }),
    interestGroups: async () => {
      const [g, i] = await Promise.all([
        sb.from('interest_groups').select('id, name, sort').order('sort'),
        sb.from('interests').select('id, name, group_id').eq('is_active', true).order('name'),
      ]);
      if (g.error) throw g.error;
      if (i.error) throw i.error;
      return (g.data as { id: number; name: string; sort: number }[]).map((grp) => ({
        ...grp, interests: (i.data as { id: number; name: string; group_id: number }[]).filter((x) => x.group_id === grp.id),
      }));
    },
    uploadProfilePhoto: async (uid: string, bytes: ArrayBuffer) => {
      const path = `${uid}/${Date.now()}.jpg`;
      const { error } = await sb.storage.from('profile-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      return path;
    },
    completeProfile: async (args: Record<string, unknown>) => {
      const { error } = await sb.rpc('complete_profile', args);
      if (error) throw error;
    },
    setNotificationPref: async (category: string, enabled: boolean) => {
      const { error } = await sb.rpc('set_notification_pref', { p_category: category, p_enabled: enabled });
      if (error) throw error;
    },
    registerPushToken: async (token: string, platform: string) => {
      const { error } = await sb.rpc('register_push_token', { p_token: token, p_platform: platform });
      if (error) throw error;
    },
    hasPassword: () => rpc<boolean>('has_password'),
    myApplication: async (): Promise<Application | null> => {
      const rows = await rpc<Application[]>('my_application');
      return rows?.[0] ?? null;
    },
    submitApplication: async (a: ApplicationInput, vouches: Vouch[]) => {
      let referred: string | null = null;
      if (a.referredByCode) referred = await rpc<string | null>('resolve_referral_code', { p_code: applicationCode(a.referredByCode) });
      const { error } = await sb.from('applicants').insert({
        id: a.id, full_name: a.fullName.trim(), phone: normalizePhone(a.phone), personal_email: normalizeEmail(a.personalEmail),
        work_email: normalizeEmail(a.workEmail), linkedin_url: a.linkedin.trim(), city: a.city, referred_by_id: referred,
      });
      if (error) throw error;
      if (vouches.length) {
        // non-fatal, as on the website
        await sb.from('referrals').insert(vouches.map((v) => ({ applicant_id: a.id, name: v.name || null, email: v.email || null, phone: v.phone || null })));
      }
    },
  };
}
export type Api = ReturnType<typeof createApi>;
