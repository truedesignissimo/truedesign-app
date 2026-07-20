alter table public.apps
  add column if not exists visibility text;

update public.apps
set visibility = 'interno'
where visibility is null;

alter table public.apps
  alter column visibility set default 'interno',
  alter column visibility set not null;

alter table public.profiles
  add column if not exists user_type text;

update public.profiles
set user_type = 'cliente'
where user_type is null;

alter table public.profiles
  alter column user_type set default 'cliente',
  alter column user_type set not null;
