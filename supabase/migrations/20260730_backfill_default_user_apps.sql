delete from public.user_apps as assignment
using public.profiles as profile
where assignment.user_id = profile.id
  and profile.user_type = 'cliente';

insert into public.user_apps (user_id, app_id)
select profile.id, app.id
from public.profiles as profile
join public.apps as app
  on app.is_active = true
where profile.user_type = 'interno'
on conflict do nothing;

insert into public.user_apps (user_id, app_id)
select profile.id, app.id
from public.profiles as profile
join public.apps as app
  on app.is_active = true
 and app.url = '/apps/true-sondaggio-iconici'
where profile.user_type = 'cliente'
on conflict do nothing;
