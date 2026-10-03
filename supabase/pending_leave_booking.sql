-- leave_booking
-- NOT YET APPLIED. Needs DELETE (removes the member from the booking chat), which the Supabase
-- tool in the Claude session hangs on. Run once in the Supabase dashboard -> SQL Editor.

create or replace function public.leave_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); b bookings; typ text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if not public.is_active_member() then raise exception 'not_a_member'; end if;
  if b.host_id = uid then raise exception 'host_must_cancel'; end if;
  if b.status in ('cancelled','completed') or b.starts_at <= now() then raise exception 'booking_closed'; end if;

  update booking_participants set status = 'left_early', left_at = now()
    where booking_id = p_booking and member_id = uid and status = 'joined';
  if not found then raise exception 'not_joined'; end if;

  -- early or late relative to the lock-in window (default 3h before start)
  typ := case when now() >= b.starts_at - make_interval(hours => rule_int('booking.lockin_hours', b.interest_id))
              then 'late_cancel' else 'early_cancel' end;
  if typ = 'late_cancel' then
    update booking_participants set status = 'left_late' where booking_id = p_booking and member_id = uid;
  end if;
  insert into score_events (member_id, type, weight_snapshot, booking_id)
    values (uid, typ, rule_num('score.weight.' || typ), p_booking);

  delete from channel_members where channel_id = b.channel_id and member_id = uid;
  if b.status = 'full' then update bookings set status = 'open' where id = p_booking; end if;
end $$;

revoke all on function public.leave_booking(uuid) from public, anon;
grant execute on function public.leave_booking(uuid) to authenticated;
