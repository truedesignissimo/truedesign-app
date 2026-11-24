-- Archivio AI — lettura per gli utenti normali (non amministratori).
--
-- Chi è amministratore lo dice già il flag `profiles.is_admin`, letto dalla funzione
-- esistente `public.is_current_user_admin()`: qui non si aggiunge nessuna funzione.
--
-- Prima di questa migrazione l'archivio rispondeva SOLO agli amministratori, quindi un
-- utente normale avrebbe aperto l'app trovandola vuota. Queste due regole aggiungono:
--   1) gli utenti approvati leggono le foto visibili (approvate, o riconosciute sopra la soglia);
--   2) gli utenti approvati leggono i file leggeri (anteprime e miniature) dell'archivio.
-- Modificare resta riservato agli amministratori, come prima.
--
-- Si può rilanciare senza danni. Richiede 20261124_archivio_ai_schema.sql.

drop policy if exists "archivio immagini: utenti read" on public.archivio_immagini;
create policy "archivio immagini: utenti read"
  on public.archivio_immagini
  for select
  to authenticated
  using (
    visibile
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.approval_status = 'approved'
    )
  );

drop policy if exists "archivio immagini: utenti read files" on storage.objects;
create policy "archivio immagini: utenti read files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'archivio-immagini'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.approval_status = 'approved'
    )
  );
