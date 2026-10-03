-- purge_deleted_accounts + its daily timer
-- NOT YET APPLIED. Uses DELETE, which the Supabase tool in the Claude session hangs on.
-- Run once in the Supabase dashboard -> SQL Editor.
--
-- 30 days after a member deletes their account, this erases their personal data:
--   * the application row (name, phone, emails, LinkedIn, city) is overwritten with placeholders,
--   * the member row is blanked (bio, photo, DOB, gender, address, field of work) and the username is released,
--   * interests, push tokens, notification settings, photos, friendships, blocks, suggestions and notifications are deleted,
--   * the login's email is replaced and the login is locked.
-- Messages and score history stay, attached to the anonymous "deleted.<id>" member (reports and fairness need them).
-- The login row itself is kept (other tables point at it), but holds no personal data.

create or replace function public.purge_deleted_accounts()
returns int language plpgsql security definer set search_path = public, auth, storage as $$
declare r record; n int := 0;
begin
  for r in select m.id, m.applicant_id from members m
           where m.state = 'deleted' and m.purged_at is null
             and m.deleted_at < now() - interval '30 days'
  loop
    update applicants set full_name = 'Deleted member', phone = 'deleted-' || id::text,
        personal_email = 'deleted-' || id::text || '@deleted.invalid',
        work_email = 'deleted-' || id::text || '@deleted.invalid',
        linkedin_url = 'deleted', city = 'deleted', referred_by_id = null
      where id = r.applicant_id;
    update members set username = 'deleted.' || left(r.id::text, 8), bio = null, photo_path = null, avatar_id = null,
        dob = null, gender = null, address_text = null, lat = null, lng = null, area = null,
        field_of_work = null, purged_at = now()
      where id = r.id;
    delete from member_interests where member_id = r.id;
    delete from push_tokens where member_id = r.id;
    delete from notification_prefs where member_id = r.id;
    delete from interest_suggestions where member_id = r.id;
    delete from notifications where member_id = r.id;
    delete from friendships where r.id in (member_a, member_b);
    delete from blocks where r.id in (blocker_id, blocked_id);
    delete from member_photos where member_id = r.id;
    delete from storage.objects where bucket_id = 'profile-photos' and name like r.id::text || '/%';
    update auth.users set email = 'deleted-' || r.id::text || '@deleted.invalid', phone = null,
        raw_user_meta_data = '{}'::jsonb, raw_app_meta_data = '{}'::jsonb,
        encrypted_password = null, banned_until = 'infinity'
      where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.purge_deleted_accounts() from public, anon, authenticated;

-- Daily at 03:30 UTC
select cron.schedule('semicircle-purge', '30 3 * * *', 'select public.purge_deleted_accounts()');
