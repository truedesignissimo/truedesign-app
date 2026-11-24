-- PASSO 2 di 2 — Assegna l'app "Archivio immagini" a tutti gli utenti approvati di oggi.
-- Da lanciare dopo dashboard-record.sql, quando la prova dal vivo è andata bene.
-- Si può rilanciare senza danni: chi ce l'ha già non viene toccato.
--
-- Gli utenti interni creati in seguito la ricevono da soli; a un cliente va assegnata dal pannello admin.
-- Dentro l'app tutti cercano e scaricano le foto; la revisione compare solo a chi ha il flag is_admin.
insert into public.user_apps (user_id, app_id)
select p.id, a.id
from public.profiles p
cross join public.apps a
where a.url = '/apps/archivio-ai'
  and p.approval_status = 'approved'
on conflict (user_id, app_id) do nothing;
