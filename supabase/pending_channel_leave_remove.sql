-- leave_channel / remove_channel_member
-- NOT YET APPLIED. These need DELETE, which the Supabase tool in the Claude session hangs on.
-- Run once in the Supabase dashboard -> SQL Editor (after pending_complete_profile.sql).

create or replace function public.leave_channel(p_channel uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); my_role text; next_admin uuid;
begin
  if not public.is_active_member() then raise exception 'not_a_member'; end if;
  select role into my_role from channel_members where channel_id = p_channel and member_id = uid;
  if my_role is null then raise exception 'not_in_channel'; end if;
  if exists (select 1 from channels where id = p_channel and kind = 'dm') then raise exception 'cannot_leave_dm'; end if;

  delete from channel_members where channel_id = p_channel and member_id = uid;

  if not exists (select 1 from channel_members where channel_id = p_channel) then
    -- last person left: close the channel (lobbies stay, they belong to the interest)
    update channels set deleted_at = now() where id = p_channel and kind <> 'lobby';
  elsif my_role = 'admin' and not exists (select 1 from channel_members where channel_id = p_channel and role = 'admin') then
    -- sole admin left: pass admin to a random remaining member
    select member_id into next_admin from channel_members where channel_id = p_channel order by random() limit 1;
    update channel_members set role = 'admin' where channel_id = p_channel and member_id = next_admin;
  end if;
end $$;

create or replace function public.remove_channel_member(p_channel uuid, p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_member = auth.uid() then raise exception 'use_leave_channel'; end if;
  if not (public.is_admin() or (public.is_active_member() and exists (select 1 from channel_members
        where channel_id = p_channel and member_id = auth.uid() and role = 'admin'))) then
    raise exception 'not_allowed'; end if;
  if exists (select 1 from channels where id = p_channel and kind in ('dm','lobby')) then
    raise exception 'not_allowed'; end if;
  delete from channel_members where channel_id = p_channel and member_id = p_member;
  if not found then raise exception 'not_in_channel'; end if;
end $$;

revoke all on function public.leave_channel(uuid), public.remove_channel_member(uuid,uuid) from public, anon;
grant execute on function public.leave_channel(uuid), public.remove_channel_member(uuid,uuid) to authenticated;
