-- complete_profile: profile setup + edit for members.
-- NOT YET APPLIED. The Supabase tool used in the Claude session hangs on any SQL containing DELETE,
-- so run this once in the Supabase dashboard -> SQL Editor.

create or replace function public.complete_profile(
  p_avatar_id smallint, p_photo_path text, p_bio text, p_dob date, p_gender text,
  p_address_text text, p_lat double precision, p_lng double precision, p_area text,
  p_field_of_work text, p_interest_ids int[])
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; ids int[];
begin
  if not exists (select 1 from members where id = uid and state = 'active') then raise exception 'not_a_member'; end if;
  select array_agg(distinct x) into ids from unnest(coalesce(p_interest_ids, array[]::int[])) x;
  n := coalesce(array_length(ids,1),0);
  if n < rule_int('profile.interests_min') or n > rule_int('profile.interests_max') then
    raise exception 'interests_count'; end if;
  if (select count(*) from interests where id = any(ids) and is_active) <> n then raise exception 'interest_invalid'; end if;
  if p_dob is null or p_dob > current_date then raise exception 'dob_required'; end if;
  if p_gender is null then raise exception 'gender_required'; end if;
  if coalesce(trim(p_address_text),'') = '' then raise exception 'address_required'; end if;
  if coalesce(trim(p_field_of_work),'') = '' then raise exception 'field_of_work_required'; end if;
  if p_avatar_id is null and coalesce(p_photo_path,'') = '' then raise exception 'photo_or_avatar_required'; end if;

  update members set avatar_id = p_avatar_id, photo_path = nullif(p_photo_path,''), bio = p_bio, dob = p_dob,
    gender = p_gender, address_text = trim(p_address_text), lat = p_lat, lng = p_lng, area = p_area,
    field_of_work = trim(p_field_of_work), onboarded_at = coalesce(onboarded_at, now())
  where id = uid;

  delete from member_interests where member_id = uid and interest_id <> all(ids);
  insert into member_interests (member_id, interest_id) select uid, i from unnest(ids) i on conflict do nothing;

  -- membership in the Lobby of every selected interest (read-only channels)
  delete from channel_members cm using channels c
    where cm.channel_id = c.id and c.kind = 'lobby' and cm.member_id = uid and c.interest_id <> all(ids);
  insert into channel_members (channel_id, member_id)
    select c.id, uid from channels c where c.kind = 'lobby' and c.interest_id = any(ids)
    on conflict do nothing;
end $$;

revoke all on function public.complete_profile(smallint,text,text,date,text,text,double precision,double precision,text,text,int[]) from public, anon;
grant execute on function public.complete_profile(smallint,text,text,date,text,text,double precision,double precision,text,text,int[]) to authenticated;
