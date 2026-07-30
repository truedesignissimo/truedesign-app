update public.profiles as profile
set full_name = 'Dario Breggie'
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email = 'dario.breggie@truedesign.it'
  and (
    profile.full_name is null
    or profile.full_name = ''
    or profile.full_name = split_part(auth_user.email, '@', 1)
  );
