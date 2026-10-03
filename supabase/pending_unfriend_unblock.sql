-- unfriend / unblock_member
-- NOT YET APPLIED. Both need DELETE, which the Supabase tool in the Claude session hangs on.
-- Run once in the Supabase dashboard -> SQL Editor.

create or replace function public.unfriend(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if not public.is_active_member() then raise exception 'not_a_member'; end if;
  delete from friendships
    where member_a = least(uid, p_member) and member_b = greatest(uid, p_member) and status = 'accepted';
  if not found then raise exception 'not_friends'; end if;
end $$;

create or replace function public.unblock_member(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_member() then raise exception 'not_a_member'; end if;
  delete from blocks where blocker_id = auth.uid() and blocked_id = p_member;
  if not found then raise exception 'not_blocked'; end if;
end $$;

revoke all on function public.unfriend(uuid), public.unblock_member(uuid) from public, anon;
grant execute on function public.unfriend(uuid), public.unblock_member(uuid) to authenticated;
