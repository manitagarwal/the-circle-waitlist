-- Duplicate protection + RPCs the site relies on. Safe to re-run.

create or replace function public.normalize_phone(p text)
returns text language sql immutable as
$$ select right(regexp_replace(coalesce(p,''), '\D', '', 'g'), 10) $$;

-- Enforce uniqueness regardless of case / phone formatting.
create unique index if not exists applicants_phone_norm_key
  on public.applicants (public.normalize_phone(phone));
create unique index if not exists applicants_personal_email_norm_key
  on public.applicants (lower(personal_email));
create unique index if not exists applicants_work_email_norm_key
  on public.applicants (lower(work_email));

-- Pre-check used by the form (anon cannot SELECT applicants directly).
create or replace function public.check_applicant_duplicates(
  p_phone text default null, p_personal_email text default null, p_work_email text default null)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'phone',          p_phone is not null and p_phone <> ''
                      and exists (select 1 from applicants where normalize_phone(phone) = normalize_phone(p_phone)),
    'personal_email', p_personal_email is not null and p_personal_email <> ''
                      and exists (select 1 from applicants where lower(personal_email) = lower(trim(p_personal_email))),
    'work_email',     p_work_email is not null and p_work_email <> ''
                      and exists (select 1 from applicants where lower(work_email) = lower(trim(p_work_email)))
  )
$$;

-- Application ID / referral code = first 8 hex chars of the applicant's id.
create or replace function public.resolve_referral_code(p_code text)
returns uuid language sql security definer set search_path = public as $$
  select id from applicants
  where length(trim(p_code)) = 8 and id::text like lower(trim(p_code)) || '%'
  limit 1
$$;

create or replace function public.check_application_status(p_code text)
returns table (full_name text, status text)
language sql security definer set search_path = public as $$
  select a.full_name, a.status from applicants a
  where length(trim(p_code)) = 8 and a.id::text like lower(trim(p_code)) || '%'
  limit 1
$$;

create or replace function public.get_declined_count()
returns integer language sql security definer set search_path = public as $$
  select count(*)::integer from applicants where status = 'rejected'
$$;

grant execute on function public.check_applicant_duplicates(text,text,text),
  public.resolve_referral_code(text), public.check_application_status(text),
  public.get_declined_count() to anon, authenticated;
